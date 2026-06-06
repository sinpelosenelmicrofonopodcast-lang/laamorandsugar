"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { submitCustomOrderAction } from "@/actions/store";
import { customOrderSchema, type CustomOrderValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

export function CustomOrderForm() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const form = useForm<CustomOrderValues>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      email: "",
      event_type: "",
      event_date: "",
      quantity: "",
      budget: undefined,
      colors_theme: "",
      description: "",
      inspiration_image_url: "",
      notes: ""
    }
  });

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "custom-order");
    formData.append("turnstileToken", turnstileToken);

    setUploading(true);
    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData
      });
      const json = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Upload failed");
      }

      setImageUrl(json.url);
      form.setValue("inspiration_image_url", json.url);
      toast.success("Inspiration image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitCustomOrderAction({
        ...values,
        turnstileToken,
        inspiration_image_url: imageUrl ?? values.inspiration_image_url ?? null,
        colors_theme: values.colors_theme || null,
        notes: values.notes || null
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      form.reset();
      setImageUrl(null);
      toast.success("Custom request sent", {
        description: "We will review your details and follow up with a quote."
      });
    });
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          Custom Order Request
        </p>
        <CardTitle>Tell us about your event and your dream treats</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="customer_name">Name</Label>
            <Input id="customer_name" {...form.register("customer_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Input id="event_type" {...form.register("event_type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date</Label>
            <Input id="event_date" type="date" {...form.register("event_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              placeholder="Ex. 3 dozen strawberries"
              {...form.register("quantity")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input id="budget" type="number" step="0.01" {...form.register("budget")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="colors_theme">Colors / Theme</Label>
            <Input id="colors_theme" {...form.register("colors_theme")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Inspiration Image</Label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border bg-secondary/60 px-5 py-8 text-sm text-muted-foreground"
            >
              <UploadCloud className="h-5 w-5" />
              {uploading
                ? "Uploading..."
                : imageUrl
                  ? "Inspiration image uploaded"
                  : "Upload reference image"}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleUpload(file);
                }
              }}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Extra Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <div className="md:col-span-2">
            <TurnstileWidget action="custom_order" onVerify={setTurnstileToken} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="gold" size="lg" disabled={isPending || uploading}>
              Submit custom order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
