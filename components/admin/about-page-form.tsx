"use client";

import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { upsertAboutPageContentAction } from "@/actions/admin";
import type { AboutPageContentModel } from "@/lib/types/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const aboutPageFormSchema = z.object({
  hero_eyebrow: z.string().min(1).max(80),
  hero_title: z.string().min(1).max(140),
  hero_text: z.string().min(1).max(500),
  hero_image_url: z.string().max(400).optional(),
  hero_image_alt: z.string().max(180).optional(),
  section_one_title: z.string().min(1).max(140),
  section_one_text: z.string().min(1).max(600),
  section_two_title: z.string().min(1).max(140),
  section_two_text: z.string().min(1).max(600),
  style_title: z.string().min(1).max(140),
  style_text: z.string().min(1).max(500),
  cta_title: z.string().min(1).max(140),
  cta_text: z.string().min(1).max(400),
  cta_button_text: z.string().min(1).max(60),
  cta_button_link: z.string().min(1).max(180),
  highlight_cards: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        text: z.string().min(1).max(220)
      })
    )
    .min(1)
    .max(4),
  gallery_images: z
    .array(
      z.object({
        image_url: z.string().max(400).optional(),
        alt_text: z.string().max(180).optional()
      })
    )
    .max(6)
}).superRefine((value, ctx) => {
  if (
    value.gallery_images.some((image) => {
      const hasUrl = Boolean(image.image_url?.trim());
      const hasAlt = Boolean(image.alt_text?.trim());
      return hasUrl !== hasAlt;
    })
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Each gallery image needs both an image URL and alt text.",
      path: ["gallery_images"]
    });
  }
});

type AboutPageFormValues = z.infer<typeof aboutPageFormSchema>;

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

function getDefaultValues(content: AboutPageContentModel): AboutPageFormValues {
  return {
    hero_eyebrow: content.hero_eyebrow ?? "",
    hero_title: content.hero_title ?? "",
    hero_text: content.hero_text ?? "",
    hero_image_url: content.hero_image_url ?? "",
    hero_image_alt: content.hero_image_alt ?? "",
    section_one_title: content.section_one_title ?? "",
    section_one_text: content.section_one_text ?? "",
    section_two_title: content.section_two_title ?? "",
    section_two_text: content.section_two_text ?? "",
    style_title: content.style_title ?? "",
    style_text: content.style_text ?? "",
    cta_title: content.cta_title ?? "",
    cta_text: content.cta_text ?? "",
    cta_button_text: content.cta_button_text ?? "",
    cta_button_link: content.cta_button_link ?? "",
    highlight_cards:
      content.highlight_cards.length > 0
        ? content.highlight_cards.map((card) => ({ ...card }))
        : [{ title: "", text: "" }],
    gallery_images:
      content.gallery_images.length > 0
        ? content.gallery_images.map((image) => ({ ...image }))
        : [{ image_url: "", alt_text: "" }]
  };
}

export function AboutPageForm({ content }: { content: AboutPageContentModel }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AboutPageFormValues>({
    resolver: zodResolver(aboutPageFormSchema),
    defaultValues: getDefaultValues(content)
  });

  const highlightCards = useFieldArray({
    control: form.control,
    name: "highlight_cards"
  });
  const galleryImages = useFieldArray({
    control: form.control,
    name: "gallery_images"
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertAboutPageContentAction({
        ...values,
        hero_image_url: cleanOptionalText(values.hero_image_url),
        hero_image_alt: cleanOptionalText(values.hero_image_alt),
        cta_button_link: values.cta_button_link.trim(),
        gallery_images: values.gallery_images.map((image) => ({
          image_url: image.image_url?.trim() ?? "",
          alt_text: image.alt_text?.trim() ?? ""
        })),
        highlight_cards: values.highlight_cards.map((card) => ({
          title: card.title.trim(),
          text: card.text.trim()
        }))
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("About page updated");
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>About page content</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={onSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hero_eyebrow">Hero eyebrow</Label>
              <Input id="hero_eyebrow" {...form.register("hero_eyebrow")} />
              <FieldError message={form.formState.errors.hero_eyebrow?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_title">Hero title</Label>
              <Input id="hero_title" {...form.register("hero_title")} />
              <FieldError message={form.formState.errors.hero_title?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hero_text">Hero text</Label>
              <Textarea id="hero_text" {...form.register("hero_text")} />
              <FieldError message={form.formState.errors.hero_text?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_image_url">Hero image URL</Label>
              <Input id="hero_image_url" {...form.register("hero_image_url")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_image_alt">Hero image alt text</Label>
              <Input id="hero_image_alt" {...form.register("hero_image_alt")} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="section_one_title">Section 1 title</Label>
              <Input id="section_one_title" {...form.register("section_one_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section_two_title">Section 2 title</Label>
              <Input id="section_two_title" {...form.register("section_two_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section_one_text">Section 1 text</Label>
              <Textarea id="section_one_text" {...form.register("section_one_text")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section_two_text">Section 2 text</Label>
              <Textarea id="section_two_text" {...form.register("section_two_text")} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="style_title">Style section title</Label>
              <Input id="style_title" {...form.register("style_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style_text">Style section text</Label>
              <Textarea id="style_text" {...form.register("style_text")} />
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-bakery-blush/20 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Highlight cards</p>
                <p className="text-sm text-muted-foreground">
                  Keep these short and customer-facing.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => highlightCards.append({ title: "", text: "" })}
                disabled={highlightCards.fields.length >= 4}
              >
                <Plus className="h-4 w-4" />
                Add card
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {highlightCards.fields.map((field, index) => (
                <div key={field.id} className="rounded-[22px] border border-border/60 bg-white/80 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Card {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        highlightCards.fields.length > 1 ? highlightCards.remove(index) : null
                      }
                      disabled={highlightCards.fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Title"
                      {...form.register(`highlight_cards.${index}.title`)}
                    />
                    <Textarea
                      placeholder="Short description"
                      {...form.register(`highlight_cards.${index}.text`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-white/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Gallery images</p>
                <p className="text-sm text-muted-foreground">
                  Paste up to 6 image URLs from your media library or storage.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => galleryImages.append({ image_url: "", alt_text: "" })}
                disabled={galleryImages.fields.length >= 6}
              >
                <Plus className="h-4 w-4" />
                Add image
              </Button>
            </div>
            <div className="grid gap-4">
              {galleryImages.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-[22px] border border-border/60 bg-white/80 p-4 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Image URL"
                    {...form.register(`gallery_images.${index}.image_url`)}
                  />
                  <Input
                    placeholder="Alt text"
                    {...form.register(`gallery_images.${index}.alt_text`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      galleryImages.fields.length > 1
                        ? galleryImages.remove(index)
                        : form.setValue("gallery_images.0", { image_url: "", alt_text: "" })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <FieldError message={form.formState.errors.gallery_images?.message as string | undefined} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta_title">CTA title</Label>
              <Input id="cta_title" {...form.register("cta_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_button_text">CTA button text</Label>
              <Input id="cta_button_text" {...form.register("cta_button_text")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cta_text">CTA text</Label>
              <Textarea id="cta_text" {...form.register("cta_text")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cta_button_link">CTA button link</Label>
              <Input id="cta_button_link" {...form.register("cta_button_link")} />
            </div>
          </div>

          <div>
            <Button type="submit" variant="gold" disabled={isPending}>
              Save about page
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
