"use client";

import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { upsertSiteSettingsAction } from "@/actions/admin";
import { DEFAULT_PAYMENT_SETTINGS } from "@/lib/payments";
import type { SiteSettingsModel } from "@/lib/types/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
    .max(3, "Use a 3-letter currency code"),
  payment_settings: z.object({
    stripe: z.object({
      enabled: z.boolean(),
      label: z.string().max(80, "Keep the label under 80 characters"),
      account: z.string().max(160, "Keep it under 160 characters").optional(),
      payment_url: z
        .union([z.string().url("Enter a valid payment URL"), z.literal("")])
        .optional(),
      instructions: z.string().max(300, "Keep instructions under 300 characters").optional()
    }),
    paypal_live: z.object({
      enabled: z.boolean(),
      label: z.string().max(80, "Keep the label under 80 characters"),
      account: z.string().max(160, "Keep it under 160 characters").optional(),
      payment_url: z
        .union([z.string().url("Enter a valid payment URL"), z.literal("")])
        .optional(),
      instructions: z.string().max(300, "Keep instructions under 300 characters").optional()
    }),
    paypal: z.object({
      enabled: z.boolean(),
      label: z.string().max(80, "Keep the label under 80 characters"),
      account: z.string().max(160, "Keep it under 160 characters").optional(),
      payment_url: z
        .union([z.string().url("Enter a valid payment URL"), z.literal("")])
        .optional(),
      instructions: z.string().max(300, "Keep instructions under 300 characters").optional()
    }),
    cash_app: z.object({
      enabled: z.boolean(),
      label: z.string().max(80, "Keep the label under 80 characters"),
      account: z.string().max(160, "Keep it under 160 characters").optional(),
      payment_url: z
        .union([z.string().url("Enter a valid payment URL"), z.literal("")])
        .optional(),
      instructions: z.string().max(300, "Keep instructions under 300 characters").optional()
    }),
    zelle: z.object({
      enabled: z.boolean(),
      label: z.string().max(80, "Keep the label under 80 characters"),
      account: z.string().max(160, "Keep it under 160 characters").optional(),
      payment_url: z
        .union([z.string().url("Enter a valid payment URL"), z.literal("")])
        .optional(),
      instructions: z.string().max(300, "Keep instructions under 300 characters").optional()
    }),
    manual_payment_note: z.string().max(300, "Keep the note under 300 characters").optional()
  })
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

function getBusinessHoursDefaults(settings: SiteSettingsModel) {
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

function getDeliveryZoneDefaults(settings: SiteSettingsModel) {
  if (!Array.isArray(settings.delivery_zones)) {
    return [{ value: "" }];
  }

  const zones = settings.delivery_zones
    .filter((entry): entry is string => typeof entry === "string")
    .map((value) => ({ value }));

  return zones.length > 0 ? zones : [{ value: "" }];
}

function getDefaultValues(settings: SiteSettingsModel): SettingsFormValues {
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
    currency: settings.currency ?? "USD",
    payment_settings: {
      stripe: {
        enabled: settings.payment_settings?.stripe.enabled ?? DEFAULT_PAYMENT_SETTINGS.stripe.enabled,
        label: settings.payment_settings?.stripe.label ?? DEFAULT_PAYMENT_SETTINGS.stripe.label,
        account: settings.payment_settings?.stripe.account ?? "",
        payment_url: settings.payment_settings?.stripe.payment_url ?? "",
        instructions:
          settings.payment_settings?.stripe.instructions ??
          DEFAULT_PAYMENT_SETTINGS.stripe.instructions ??
          ""
      },
      paypal_live: {
        enabled:
          settings.payment_settings?.paypal_live.enabled ??
          DEFAULT_PAYMENT_SETTINGS.paypal_live.enabled,
        label:
          settings.payment_settings?.paypal_live.label ??
          DEFAULT_PAYMENT_SETTINGS.paypal_live.label,
        account: settings.payment_settings?.paypal_live.account ?? "",
        payment_url: settings.payment_settings?.paypal_live.payment_url ?? "",
        instructions:
          settings.payment_settings?.paypal_live.instructions ??
          DEFAULT_PAYMENT_SETTINGS.paypal_live.instructions ??
          ""
      },
      paypal: {
        enabled: settings.payment_settings?.paypal.enabled ?? DEFAULT_PAYMENT_SETTINGS.paypal.enabled,
        label: settings.payment_settings?.paypal.label ?? DEFAULT_PAYMENT_SETTINGS.paypal.label,
        account: settings.payment_settings?.paypal.account ?? "",
        payment_url: settings.payment_settings?.paypal.payment_url ?? "",
        instructions:
          settings.payment_settings?.paypal.instructions ??
          DEFAULT_PAYMENT_SETTINGS.paypal.instructions ??
          ""
      },
      cash_app: {
        enabled:
          settings.payment_settings?.cash_app.enabled ?? DEFAULT_PAYMENT_SETTINGS.cash_app.enabled,
        label: settings.payment_settings?.cash_app.label ?? DEFAULT_PAYMENT_SETTINGS.cash_app.label,
        account: settings.payment_settings?.cash_app.account ?? "",
        payment_url: settings.payment_settings?.cash_app.payment_url ?? "",
        instructions:
          settings.payment_settings?.cash_app.instructions ??
          DEFAULT_PAYMENT_SETTINGS.cash_app.instructions ??
          ""
      },
      zelle: {
        enabled: settings.payment_settings?.zelle.enabled ?? DEFAULT_PAYMENT_SETTINGS.zelle.enabled,
        label: settings.payment_settings?.zelle.label ?? DEFAULT_PAYMENT_SETTINGS.zelle.label,
        account: settings.payment_settings?.zelle.account ?? "",
        payment_url: settings.payment_settings?.zelle.payment_url ?? "",
        instructions:
          settings.payment_settings?.zelle.instructions ??
          DEFAULT_PAYMENT_SETTINGS.zelle.instructions ??
          ""
      },
      manual_payment_note:
        settings.payment_settings?.manual_payment_note ??
        DEFAULT_PAYMENT_SETTINGS.manual_payment_note ??
        ""
    }
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

export function SettingsForm({ settings }: { settings: SiteSettingsModel }) {
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
        currency: values.currency.trim().toUpperCase(),
        payment_settings: {
          stripe: {
            enabled: values.payment_settings.stripe.enabled,
            label: values.payment_settings.stripe.label.trim(),
            account: cleanOptionalText(values.payment_settings.stripe.account),
            payment_url: cleanOptionalText(values.payment_settings.stripe.payment_url),
            instructions: cleanOptionalText(values.payment_settings.stripe.instructions)
          },
          paypal_live: {
            enabled: values.payment_settings.paypal_live.enabled,
            label: values.payment_settings.paypal_live.label.trim(),
            account: cleanOptionalText(values.payment_settings.paypal_live.account),
            payment_url: cleanOptionalText(values.payment_settings.paypal_live.payment_url),
            instructions: cleanOptionalText(values.payment_settings.paypal_live.instructions)
          },
          paypal: {
            enabled: values.payment_settings.paypal.enabled,
            label: values.payment_settings.paypal.label.trim(),
            account: cleanOptionalText(values.payment_settings.paypal.account),
            payment_url: cleanOptionalText(values.payment_settings.paypal.payment_url),
            instructions: cleanOptionalText(values.payment_settings.paypal.instructions)
          },
          cash_app: {
            enabled: values.payment_settings.cash_app.enabled,
            label: values.payment_settings.cash_app.label.trim(),
            account: cleanOptionalText(values.payment_settings.cash_app.account),
            payment_url: cleanOptionalText(values.payment_settings.cash_app.payment_url),
            instructions: cleanOptionalText(values.payment_settings.cash_app.instructions)
          },
          zelle: {
            enabled: values.payment_settings.zelle.enabled,
            label: values.payment_settings.zelle.label.trim(),
            account: cleanOptionalText(values.payment_settings.zelle.account),
            payment_url: cleanOptionalText(values.payment_settings.zelle.payment_url),
            instructions: cleanOptionalText(values.payment_settings.zelle.instructions)
          },
          manual_payment_note: cleanOptionalText(values.payment_settings.manual_payment_note)
        }
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
          <div className="rounded-[28px] border border-border/70 bg-bakery-blush/20 p-5 md:col-span-2">
            <div className="mb-4 space-y-1">
              <Label className="text-base font-semibold text-foreground">Payment methods</Label>
              <p className="text-sm text-muted-foreground">
                Turn methods on or off while Stripe is not ready. Customers will only see enabled options at checkout.
              </p>
            </div>
            <div className="grid gap-5">
              {([
                ["stripe", "Stripe"],
                ["paypal_live", "PayPal Live"],
                ["paypal", "PayPal"],
                ["cash_app", "Cash App"],
                ["zelle", "Zelle"]
              ] as const).map(([key, title]) => (
                <div key={key} className="rounded-[24px] border border-border/70 bg-white/80 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Checkbox
                      checked={Boolean(form.watch(`payment_settings.${key}.enabled`))}
                      onCheckedChange={(checked) =>
                        form.setValue(`payment_settings.${key}.enabled`, Boolean(checked), {
                          shouldDirty: true
                        })
                      }
                    />
                    <div>
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground">
                        {key === "paypal_live"
                          ? "Control whether live PayPal appears at checkout when the PayPal environment variables are configured."
                          : "Control whether this payment option appears at checkout."}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`payment_settings.${key}.label`}>Label</Label>
                      <Input id={`payment_settings.${key}.label`} {...form.register(`payment_settings.${key}.label`)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`payment_settings.${key}.account`}>
                        {key === "stripe" || key === "paypal_live"
                          ? "Account note"
                          : "Account / handle"}
                      </Label>
                      <Input id={`payment_settings.${key}.account`} {...form.register(`payment_settings.${key}.account`)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`payment_settings.${key}.payment_url`}>
                        Payment link
                      </Label>
                      <Input id={`payment_settings.${key}.payment_url`} {...form.register(`payment_settings.${key}.payment_url`)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`payment_settings.${key}.instructions`}>
                        Instructions
                      </Label>
                      <Textarea id={`payment_settings.${key}.instructions`} {...form.register(`payment_settings.${key}.instructions`)} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="payment_settings.manual_payment_note">Manual payment note</Label>
                <Textarea
                  id="payment_settings.manual_payment_note"
                  {...form.register("payment_settings.manual_payment_note")}
                />
                <p className="text-sm text-muted-foreground">
                  Example: Orders remain pending until payment is confirmed.
                </p>
              </div>
            </div>
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
