"use client";

import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { upsertSiteSettingsAction } from "@/actions/admin";
import type { SiteSettingsRow } from "@/lib/types/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const businessHourDays = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" }
] as const;

const settingsFormSchema = z.object({
  business_name: z.string().trim().min(2, "Business name is required").max(120),
  tagline: z.string().max(160, "Keep the tagline under 160 characters").optional(),
  support_email: z.union([z.string().email("Enter a valid email address"), z.literal("")]).optional(),
  support_phone: z.string().max(30, "Keep the phone number under 30 characters").optional(),
  instagram_url: z.union([z.string().url("Enter a valid Instagram URL"), z.literal("")]).optional(),
  facebook_url: z.union([z.string().url("Enter a valid Facebook URL"), z.literal("")]).optional(),
  tiktok_url: z.union([z.string().url("Enter a valid TikTok URL"), z.literal("")]).optional(),
  address: z.string().max(250, "Keep the address under 250 characters").optional(),
  business_hours: z.object({
    monday: z.string().max(80, "Keep it under 80 characters").optional(),
    tuesday: z.string().max(80, "Keep it under 80 characters").optional(),
    wednesday: z.string().max(80, "Keep it under 80 characters").optional(),
    thursday: z.string().max(80, "Keep it under 80 characters").optional(),
    friday: z.string().max(80, "Keep it under 80 characters").optional(),
    saturday: z.string().max(80, "Keep it under 80 characters").optional(),
    sunday: z.string().max(80, "Keep it under 80 characters").optional()
  }),
  delivery_zones: z
    .array(
      z.object({
        value: z.string().max(120, "Keep each zone under 120 characters").optional()
      })
    )
    .max(20, "You can add up to 20 delivery zones"),
  pickup_instructions: z.string().max(500, "Keep pickup instructions under 500 characters").optional(),
  free_delivery_threshold: z
    .union([z.coerce.number().min(0, "Must be 0 or greater"), z.literal("")])
    .optional(),
  currency: z
    .string()
    .trim()
    .min(3, "Use a 3-letter currency code")
    .max(3, "Use a 3-letter currency code")
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

function getBusinessHoursDefaults(settings: SiteSettingsRow) {
  const source =
    settings.business_hours && typeof settings.business_hours === "object" && !Array.isArray(settings.business_hours)
      ? settings.business_hours
      : {};

  return {
    monday: typeof source.monday === "string" ? source.monday : "",
    tuesday: typeof source.tuesday === "string" ? source.tuesday : "",
    wednesday: typeof source.wednesday === "string" ? source.wednesday : "",
    thursday: typeof source.thursday === "string" ? source.thursday : "",
    friday: typeof source.friday === "string" ? source.friday : "",
    saturday: typeof source.saturday === "string" ? source.saturday : "",
    sunday: typeof source.sunday === "string" ? source.sunday : ""
  };
}

function getDeliveryZoneDefaults(settings: SiteSettingsRow) {
  if (!Array.isArray(settings.delivery_zones)) {
    return [{ value: "" }];
  }

  const zones = settings.delivery_zones
    .filter((entry): entry is string => typeof entry === "string")
    .map((value) => ({ value }));

  return zones.length > 0 ? zones : [{ value: "" }];
}

function getDefaultValues(settings: SiteSettingsRow): SettingsFormValues {
  return {
    business_name: settings.business_name ?? "",
    tagline: settings.tagline ?? "",
    support_email: settings.support_email ?? "",
    support_phone: settings.support_phone ?? "",
    instagram_url: settings.instagram_url ?? "",
    facebook_url: settings.facebook_url ?? "",
    tiktok_url: settings.tiktok_url ?? "",
    address: settings.address ?? "",
    business_hours: getBusinessHoursDefaults(settings),
    delivery_zones: getDeliveryZoneDefaults(settings),
    pickup_instructions: settings.pickup_instructions ?? "",
    free_delivery_threshold: settings.free_delivery_threshold ?? "",
    currency: settings.currency ?? "USD"
  };
}

function cleanOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

export function SettingsForm({ settings }: { settings: SiteSettingsRow }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: getDefaultValues(settings)
  });
  const deliveryZones = useFieldArray({
    control: form.control,
    name: "delivery_zones"
  });

  const onSubmit = form.handleSubmit((values) => {
    const businessHours = Object.fromEntries(
      Object.entries(values.business_hours)
        .map(([day, hours]) => [day, hours.trim()])
        .filter(([, hours]) => hours.length > 0)
    );
    const deliveryZonesPayload = values.delivery_zones
      .map((zone) => zone.value?.trim() ?? "")
      .filter(Boolean);

    startTransition(async () => {
      const result = await upsertSiteSettingsAction({
        business_name: values.business_name.trim(),
        tagline: cleanOptionalText(values.tagline),
        support_email: cleanOptionalText(values.support_email),
        support_phone: cleanOptionalText(values.support_phone),
        instagram_url: cleanOptionalText(values.instagram_url),
        facebook_url: cleanOptionalText(values.facebook_url),
        tiktok_url: cleanOptionalText(values.tiktok_url),
        address: cleanOptionalText(values.address),
        business_hours: Object.keys(businessHours).length > 0 ? businessHours : null,
        delivery_zones: deliveryZonesPayload.length > 0 ? deliveryZonesPayload : null,
        pickup_instructions: cleanOptionalText(values.pickup_instructions),
        free_delivery_threshold:
          values.free_delivery_threshold === "" ? null : values.free_delivery_threshold,
        currency: values.currency.trim().toUpperCase()
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Settings updated");
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" {...form.register("business_name")} />
            <FieldError message={form.formState.errors.business_name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...form.register("tagline")} />
            <FieldError message={form.formState.errors.tagline?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support_email">Support email</Label>
            <Input id="support_email" type="email" {...form.register("support_email")} />
            <FieldError message={form.formState.errors.support_email?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support_phone">Support phone</Label>
            <Input id="support_phone" {...form.register("support_phone")} />
            <FieldError message={form.formState.errors.support_phone?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram_url">Instagram URL</Label>
            <Input id="instagram_url" {...form.register("instagram_url")} />
            <FieldError message={form.formState.errors.instagram_url?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url">Facebook URL</Label>
            <Input id="facebook_url" {...form.register("facebook_url")} />
            <FieldError message={form.formState.errors.facebook_url?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok_url">TikTok URL</Label>
            <Input id="tiktok_url" {...form.register("tiktok_url")} />
            <FieldError message={form.formState.errors.tiktok_url?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" maxLength={3} {...form.register("currency")} />
            <FieldError message={form.formState.errors.currency?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register("address")} />
            <FieldError message={form.formState.errors.address?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="free_delivery_threshold">Free delivery threshold</Label>
            <Input
              id="free_delivery_threshold"
              type="number"
              step="0.01"
              {...form.register("free_delivery_threshold")}
            />
            <FieldError message={form.formState.errors.free_delivery_threshold?.message} />
          </div>
          <div className="rounded-[28px] border border-border/70 bg-bakery-blush/30 p-5 md:col-span-2">
            <div className="mb-4 space-y-1">
              <Label className="text-base font-semibold text-foreground">Business hours</Label>
              <p className="text-sm text-muted-foreground">
                Add hours the way customers read them, for example: `9:00 AM - 6:00 PM` or `Closed`.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {businessHourDays.map((day) => (
                <div key={day.key} className="space-y-2">
                  <Label htmlFor={`business_hours.${day.key}`}>{day.label}</Label>
                  <Input
                    id={`business_hours.${day.key}`}
                    placeholder="9:00 AM - 6:00 PM"
                    {...form.register(`business_hours.${day.key}`)}
                  />
                  <FieldError
                    message={form.formState.errors.business_hours?.[day.key]?.message}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-border/70 bg-white/70 p-5 md:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <Label className="text-base font-semibold text-foreground">Delivery zones</Label>
                <p className="text-sm text-muted-foreground">
                  Add the areas you deliver to, one per line.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => deliveryZones.append({ value: "" })}
                disabled={deliveryZones.fields.length >= 20}
              >
                <Plus className="h-4 w-4" />
                Add zone
              </Button>
            </div>
            <div className="space-y-3">
              {deliveryZones.fields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Houston Heights, Katy, Sugar Land..."
                      {...form.register(`delivery_zones.${index}.value`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deliveryZones.fields.length > 1
                          ? deliveryZones.remove(index)
                          : form.setValue("delivery_zones.0.value", "")
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FieldError
                    message={form.formState.errors.delivery_zones?.[index]?.value?.message}
                  />
                </div>
              ))}
            </div>
            <FieldError message={form.formState.errors.delivery_zones?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pickup_instructions">Pickup instructions</Label>
            <Textarea id="pickup_instructions" {...form.register("pickup_instructions")} />
            <FieldError message={form.formState.errors.pickup_instructions?.message} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="gold" disabled={isPending}>
              Save settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
