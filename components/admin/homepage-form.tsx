"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { upsertHomepageContentAction } from "@/actions/admin";
import type { HomepageContentRow } from "@/lib/types/app";
import { homepageSchema } from "@/lib/validations";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HomepageValues = z.infer<typeof homepageSchema>;

export function HomepageForm({ homepage }: { homepage: HomepageContentRow }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<HomepageValues>({
    resolver: zodResolver(homepageSchema),
    defaultValues: homepage
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertHomepageContentAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Homepage content updated");
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage editor</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          {[
            ["banner_text", "Banner text"],
            ["banner_cta_label", "Banner CTA label"],
            ["banner_cta_href", "Banner CTA href"],
            ["hero_eyebrow", "Hero eyebrow"],
            ["hero_title", "Hero title"],
            ["hero_primary_cta_label", "Primary CTA label"],
            ["hero_primary_cta_href", "Primary CTA href"],
            ["hero_secondary_cta_label", "Secondary CTA label"],
            ["hero_secondary_cta_href", "Secondary CTA href"],
            ["featured_heading", "Featured heading"],
            ["process_heading", "Process heading"],
            ["testimonials_heading", "Testimonials heading"],
            ["cta_heading", "CTA heading"]
          ].map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Input {...form.register(field as keyof HomepageValues)} />
            </div>
          ))}
          {[
            ["hero_description", "Hero description"],
            ["featured_description", "Featured description"],
            ["process_description", "Process description"],
            ["testimonials_description", "Testimonials description"],
            ["cta_description", "CTA description"]
          ].map(([field, label]) => (
            <div key={field} className="space-y-2 md:col-span-2">
              <Label>{label}</Label>
              <Textarea {...form.register(field as keyof HomepageValues)} />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button type="submit" variant="gold" disabled={isPending}>
              Save homepage content
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
