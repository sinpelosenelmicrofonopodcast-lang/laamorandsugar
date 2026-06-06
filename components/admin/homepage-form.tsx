"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { upsertHomepageContentAction } from "@/actions/admin";
import {
  DEFAULT_HOMEPAGE_HOME_CONTENT,
  DEFAULT_HOMEPAGE_SECTIONS_ORDER,
  HOMEPAGE_ICON_OPTIONS
} from "@/lib/homepage";
import type {
  HomepageContentModel,
  HomepageSectionKey,
  MediaAssetRow,
  ProductWithRelations,
  SeasonalSpecialRow,
  TestimonialRow
} from "@/lib/types/app";
import { homepageSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HomepageValues = z.infer<typeof homepageSchema>;

type SelectionPath =
  | "content_json.featured.product_ids"
  | "content_json.seasonal.product_ids"
  | "content_json.seasonal.special_ids"
  | "content_json.testimonials.selected_ids";

const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

const sectionLabels: Record<HomepageSectionKey, string> = {
  featured: "Best Sellers",
  custom_orders: "Custom Orders",
  how_it_works: "How It Works",
  seasonal: "Seasonal Specials",
  trust: "Brand Promise",
  testimonials: "Testimonials",
  gallery: "Gallery",
  final_cta: "Final CTA"
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function getFirstErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("message" in value && typeof value.message === "string") {
    return value.message;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = getFirstErrorMessage(item);
      if (message) {
        return message;
      }
    }
    return null;
  }

  for (const entry of Object.values(value)) {
    const message = getFirstErrorMessage(entry);
    if (message) {
      return message;
    }
  }

  return null;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function cloneDefaultHomeContent() {
  return {
    ...DEFAULT_HOMEPAGE_HOME_CONTENT,
    hero: {
      ...DEFAULT_HOMEPAGE_HOME_CONTENT.hero,
      chips: [...DEFAULT_HOMEPAGE_HOME_CONTENT.hero.chips]
    },
    best_sellers: {
      ...DEFAULT_HOMEPAGE_HOME_CONTENT.best_sellers
    },
    occasions: [...DEFAULT_HOMEPAGE_HOME_CONTENT.occasions],
    final_cta: {
      ...DEFAULT_HOMEPAGE_HOME_CONTENT.final_cta
    },
    custom_order: {
      ...DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order
    }
  };
}

async function uploadImage(file: File) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`"${file.name}" is too large. Please use an image smaller than 4 MB.`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", "admin");

  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: formData
  });
  const json = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !json.url) {
    throw new Error(json.error ?? "Image upload failed");
  }

  return json.url;
}

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function ImageField({
  form,
  assets,
  label,
  urlPath,
  altPath,
  previewFallback = "/products/placeholder-elegance.svg"
}: {
  form: UseFormReturn<HomepageValues>;
  assets: MediaAssetRow[];
  label: string;
  urlPath:
    | "hero_image_url"
    | "hero_mobile_image_url"
    | "hero_background_image_url"
    | "content_json.custom_orders.image_url"
    | "content_json.seasonal.image_url"
    | "content_json.final_cta.background_image_url";
  altPath:
    | "hero_image_alt"
    | "hero_mobile_image_alt"
    | "hero_background_image_alt"
    | "content_json.custom_orders.image_alt"
    | "content_json.seasonal.image_alt"
    | "content_json.final_cta.background_image_alt";
  previewFallback?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputId = useId();
  const selectedUrl = form.watch(urlPath);
  const assetOptions = assets.slice(0, 24);

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-border p-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] border border-border bg-white">
          <Image
            src={selectedUrl || previewFallback}
            alt={form.watch(altPath) || label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input placeholder="Paste image URL" {...form.register(urlPath)} />
        <select
          className="flex h-11 w-full rounded-full border border-border bg-white/80 px-4 text-sm"
          defaultValue=""
          onChange={(event) => {
            const asset = assets.find((item) => item.id === event.target.value);
            if (!asset?.public_url) {
              return;
            }
            form.setValue(urlPath, asset.public_url, {
              shouldDirty: true,
              shouldValidate: true
            });
            if (!form.getValues(altPath)?.trim()) {
              form.setValue(altPath, asset.file_name, {
                shouldDirty: true,
                shouldValidate: true
              });
            }
          }}
        >
          <option value="">Select from media library</option>
          {assetOptions.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.file_name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input placeholder="Alt text" {...form.register(altPath)} />
        <div>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setIsUploading(true);
              try {
                const url = await uploadImage(file);
                form.setValue(urlPath, url, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                if (!form.getValues(altPath)?.trim()) {
                  form.setValue(altPath, file.name, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }
                toast.success("Image uploaded");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Image upload failed");
              } finally {
                setIsUploading(false);
                event.target.value = "";
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(fileInputId)?.click()}
            disabled={isUploading}
          >
            <ImagePlus className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload image"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconSelect({
  form,
  path
}: {
  form: UseFormReturn<HomepageValues>;
  path:
    | `content_json.how_it_works.steps.${number}.icon`
    | `content_json.trust.cards.${number}.icon`;
}) {
  return (
    <select
      className="flex h-11 w-full rounded-full border border-border bg-white/80 px-4 text-sm"
      {...form.register(path)}
    >
      {HOMEPAGE_ICON_OPTIONS.map((icon) => (
        <option key={icon} value={icon}>
          {icon.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

export function HomepageForm({
  homepage,
  products,
  testimonials,
  specials,
  assets
}: {
  homepage: HomepageContentModel;
  products: ProductWithRelations[];
  testimonials: TestimonialRow[];
  specials: SeasonalSpecialRow[];
  assets: MediaAssetRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const form = useForm<HomepageValues>({
    resolver: zodResolver(homepageSchema),
    defaultValues: homepage
  });

  const howItWorksSteps = useFieldArray({
    control: form.control,
    name: "content_json.how_it_works.steps"
  });
  const trustCards = useFieldArray({
    control: form.control,
    name: "content_json.trust.cards"
  });
  const galleryImages = useFieldArray({
    control: form.control,
    name: "content_json.gallery.images"
  });

  const featuredProductIds = form.watch("content_json.featured.product_ids");
  const seasonalProductIds = form.watch("content_json.seasonal.product_ids");
  const seasonalSpecialIds = form.watch("content_json.seasonal.special_ids");
  const selectedTestimonialIds = form.watch("content_json.testimonials.selected_ids");
  const sectionOrder = form.watch("content_json.sections_order");
  const homeContent = form.watch("content_json.home_content");

  const toggleSelection = (path: SelectionPath, id: string) => {
    const current = (form.getValues(path) ?? []) as string[];
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    form.setValue(path, next, { shouldDirty: true, shouldValidate: true });
  };

  const moveSelection = (path: SelectionPath, index: number, direction: -1 | 1) => {
    const current = [...((form.getValues(path) ?? []) as string[])];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= current.length) {
      return;
    }
    form.setValue(path, moveItem(current, index, nextIndex), {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionOrder.length) {
      return;
    }
    form.setValue("content_json.sections_order", moveItem(sectionOrder, index, nextIndex), {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const selectedProducts = featuredProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean) as ProductWithRelations[];

  const selectedSeasonalProducts = seasonalProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean) as ProductWithRelations[];

  const selectedSeasonalSpecials = seasonalSpecialIds
    .map((id) => specials.find((special) => special.id === id))
    .filter(Boolean) as SeasonalSpecialRow[];

  const selectedTestimonials = selectedTestimonialIds
    .map((id) => testimonials.find((testimonial) => testimonial.id === id))
    .filter(Boolean) as TestimonialRow[];

  const formErrorMessage =
    submitMessage ??
    (form.formState.submitCount > 0
      ? getFirstErrorMessage(form.formState.errors) ??
        (Object.keys(form.formState.errors).length > 0
          ? "Please review the highlighted fields before saving."
          : null)
      : null);

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        try {
          const payload: HomepageValues = {
            ...values,
            hero_eyebrow: values.content_json.home_content.hero.eyebrow,
            hero_title: values.content_json.home_content.hero.headline,
            hero_description: values.content_json.home_content.hero.subheadline,
            hero_primary_cta_label: values.content_json.home_content.hero.cta_primary,
            hero_secondary_cta_label: values.content_json.home_content.hero.cta_secondary,
            featured_heading: values.content_json.home_content.best_sellers.title,
            featured_description: values.content_json.home_content.best_sellers.subtitle,
            cta_heading: values.content_json.home_content.final_cta.title,
            cta_description: values.content_json.home_content.final_cta.text,
            content_json: {
              ...values.content_json,
              custom_orders: {
                ...values.content_json.custom_orders,
                title: values.content_json.home_content.custom_order.title,
                description: values.content_json.home_content.custom_order.description,
                bullets: values.content_json.home_content.occasions
              },
              how_it_works: {
                ...values.content_json.how_it_works,
                title: values.process_heading ?? values.content_json.how_it_works.title
              },
              trust: {
                ...values.content_json.trust,
                title:
                  values.content_json.home_content.about
                    .split(/\n+/)
                    .map((line) => line.trim())
                    .filter(Boolean)[0] ?? values.content_json.trust.title,
                description: values.content_json.home_content.about
              },
              final_cta: {
                ...values.content_json.final_cta,
                title: values.content_json.home_content.final_cta.title,
                text: values.content_json.home_content.final_cta.text
              }
            }
          };

          setSubmitMessage(null);
          const result = await upsertHomepageContentAction(payload);
          if (result.error) {
            setSubmitMessage(result.error);
            toast.error(result.error);
            return;
          }

          toast.success("Homepage content updated");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to save homepage content.";
          setSubmitMessage(message);
          toast.error(message);
        }
      });
    },
    (errors) => {
      const message =
        getFirstErrorMessage(errors) ?? "Please review the highlighted fields before saving.";
      setSubmitMessage(message);
      toast.error(message);
    }
  );

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {formErrorMessage ? (
        <div className="rounded-[1.5rem] border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          We could not save the homepage yet. {formErrorMessage}
        </div>
      ) : null}

      <SectionCard
        title="Homepage Settings"
        description="Control the home hero, section copy, SEO, section order, and media without touching code."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo_title">Homepage SEO title</Label>
            <Input id="seo_title" {...form.register("seo_title")} />
            <FieldError message={form.formState.errors.seo_title?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seo_description">Homepage SEO description</Label>
            <Textarea id="seo_description" {...form.register("seo_description")} />
            <FieldError message={form.formState.errors.seo_description?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner_text">Top banner text</Label>
            <Input id="banner_text" {...form.register("banner_text")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner_cta_label">Top banner button label</Label>
            <Input id="banner_cta_label" {...form.register("banner_cta_label")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="banner_cta_href">Top banner button link</Label>
            <Input id="banner_cta_href" {...form.register("banner_cta_href")} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Conversion Copy System"
        description="This is the centralized editable copy used across the homepage. Reset it anytime without redeploying."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.setValue("content_json.home_content", cloneDefaultHomeContent(), {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          >
            Reset default sales copy
          </Button>
        </div>
        <div className="rounded-[1.5rem] border border-border bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Live copy preview
          </p>
          <h3 className="mt-3 font-serif text-3xl text-foreground">{homeContent.hero.headline}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{homeContent.hero.subheadline}</p>
          <p className="mt-3 text-sm font-semibold text-bakery-rose">{homeContent.hero.urgency}</p>
          <p className="mt-4 text-sm italic text-foreground/80">{homeContent.hero.micro_copy}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-2 text-xs font-medium">
              {homeContent.hero.cta_primary}
            </span>
            <span className="rounded-full border border-border px-3 py-2 text-xs font-medium">
              {homeContent.hero.cta_secondary}
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Section Order"
        description="Drag-free ordering for the main homepage sections. Hero stays at the top."
      >
        <div className="grid gap-3">
          {sectionOrder.map((sectionKey, index) => (
            <div
              key={sectionKey}
              className="flex items-center justify-between rounded-[1.25rem] border border-border bg-white/70 px-4 py-3"
            >
              <p className="font-medium text-foreground">{sectionLabels[sectionKey]}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sectionOrder.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              form.setValue(
                "content_json.sections_order",
                [...DEFAULT_HOMEPAGE_SECTIONS_ORDER],
                { shouldDirty: true, shouldValidate: true }
              )
            }
          >
            Reset default order
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Hero Section" description="Editable hero text, buttons, and supporting imagery.">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero_eyebrow">Eyebrow</Label>
            <Input id="hero_eyebrow" {...form.register("content_json.home_content.hero.eyebrow")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_title">Headline</Label>
            <Input id="hero_title" {...form.register("content_json.home_content.hero.headline")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="hero_description">Subtitle</Label>
            <Textarea id="hero_description" {...form.register("content_json.home_content.hero.subheadline")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Urgency line</Label>
            <Input {...form.register("content_json.home_content.hero.urgency")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Micro copy</Label>
            <Input {...form.register("content_json.home_content.hero.micro_copy")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_primary_cta_label">Primary button text</Label>
            <Input id="hero_primary_cta_label" {...form.register("content_json.home_content.hero.cta_primary")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_primary_cta_href">Primary button link</Label>
            <Input id="hero_primary_cta_href" {...form.register("hero_primary_cta_href")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_secondary_cta_label">Secondary button text</Label>
            <Input
              id="hero_secondary_cta_label"
              {...form.register("content_json.home_content.hero.cta_secondary")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_secondary_cta_href">Secondary button link</Label>
            <Input id="hero_secondary_cta_href" {...form.register("hero_secondary_cta_href")} />
          </div>
          <div className="space-y-2">
            <Label>Badge text</Label>
            <Input {...form.register("content_json.home_content.hero.badge")} />
          </div>
          <div className="space-y-2">
            <Label>Image badge text</Label>
            <Input {...form.register("content_json.home_content.hero.image_badge")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Image card headline</Label>
            <Textarea {...form.register("content_json.home_content.hero.image_title")} />
          </div>
          <div className="space-y-2">
            <Label>Reserve card title</Label>
            <Input {...form.register("content_json.home_content.hero.reserve_card_title")} />
          </div>
          <div className="space-y-2">
            <Label>Delivery card title</Label>
            <Input {...form.register("content_json.home_content.hero.delivery_card_title")} />
          </div>
          <div className="space-y-2">
            <Label>Reserve card text</Label>
            <Textarea {...form.register("content_json.home_content.hero.reserve_card_text")} />
          </div>
          <div className="space-y-2">
            <Label>Delivery card text</Label>
            <Textarea {...form.register("content_json.home_content.hero.delivery_card_text")} />
          </div>
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Hero chips</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue(
                    "content_json.home_content.hero.chips",
                    [...homeContent.hero.chips, ""],
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
              >
                <Plus className="h-4 w-4" />
                Add chip
              </Button>
            </div>
            {homeContent.hero.chips.map((chip, index) => (
              <div key={`${chip}-${index}`} className="flex gap-3">
                <Input {...form.register(`content_json.home_content.hero.chips.${index}`)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    form.setValue(
                      "content_json.home_content.hero.chips",
                      homeContent.hero.chips.filter((_, chipIndex) => chipIndex !== index),
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="md:col-span-2 grid gap-4 lg:grid-cols-3">
            <ImageField
              form={form}
              assets={assets}
              label="Hero image"
              urlPath="hero_image_url"
              altPath="hero_image_alt"
            />
            <ImageField
              form={form}
              assets={assets}
              label="Mobile hero image"
              urlPath="hero_mobile_image_url"
              altPath="hero_mobile_image_alt"
            />
            <ImageField
              form={form}
              assets={assets}
              label="Hero background image"
              urlPath="hero_background_image_url"
              altPath="hero_background_image_alt"
              previewFallback="/brand/la-logo-official.png"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Best Sellers" description="Control the section copy, visibility, and which products appear first.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.featured.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.featured.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show Best Sellers section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="featured_heading">Section title</Label>
            <Input id="featured_heading" {...form.register("content_json.home_content.best_sellers.title")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="featured_description">Section subtitle</Label>
            <Textarea id="featured_description" {...form.register("content_json.home_content.best_sellers.subtitle")} />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Selected products</p>
            {selectedProducts.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-border p-4 text-sm text-muted-foreground">
                No homepage products selected yet. Toggle products from the list on the right.
              </div>
            ) : (
              selectedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-[1.25rem] border border-border bg-white/80 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.short_description ?? product.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        moveSelection("content_json.featured.product_ids", index, -1)
                      }
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        moveSelection("content_json.featured.product_ids", index, 1)
                      }
                      disabled={index === selectedProducts.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Available products</p>
            <div className="grid gap-3 max-h-[28rem] overflow-auto pr-1">
              {products.map((product) => {
                const selected = featuredProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleSelection("content_json.featured.product_ids", product.id)}
                    className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                      selected
                        ? "border-bakery-gold bg-bakery-gold/10"
                        : "border-border bg-white/70 hover:border-bakery-rose/40"
                    }`}
                  >
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.categories?.name ?? "Uncategorized"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Custom Orders Section" description="Promote event-based, made-for-you orders with image, bullets, and CTA.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.custom_orders.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.custom_orders.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show Custom Orders section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("content_json.home_content.custom_order.title")} />
          </div>
          <div className="space-y-2">
            <Label>Button text</Label>
            <Input {...form.register("content_json.custom_orders.button_text")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea {...form.register("content_json.home_content.custom_order.description")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Button link</Label>
            <Input {...form.register("content_json.custom_orders.button_link")} />
          </div>
          <div className="md:col-span-2">
            <ImageField
              form={form}
              assets={assets}
              label="Custom orders image"
              urlPath="content_json.custom_orders.image_url"
              altPath="content_json.custom_orders.image_alt"
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Occasions</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue(
                    "content_json.home_content.occasions",
                    [...homeContent.occasions, ""],
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
              >
                <Plus className="h-4 w-4" />
                Add occasion
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Occasions heading</Label>
              <Input {...form.register("content_json.home_content.occasions_heading")} />
            </div>
            {homeContent.occasions.map((bullet, index) => (
              <div key={`${bullet}-${index}`} className="flex gap-3">
                <Input {...form.register(`content_json.home_content.occasions.${index}`)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    form.setValue(
                      "content_json.home_content.occasions",
                      homeContent.occasions.filter((_, bulletIndex) => bulletIndex !== index),
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="How It Works" description="Edit the title, short intro, and steps customers see before they order.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.how_it_works.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.how_it_works.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show How It Works section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="process_heading">Section title</Label>
            <Input id="process_heading" {...form.register("process_heading")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="process_description">Section subtitle</Label>
            <Textarea id="process_description" {...form.register("process_description")} />
          </div>
        </div>
        <div className="space-y-4">
          {howItWorksSteps.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[180px_1fr_1.3fr_auto]"
            >
              <IconSelect
                form={form}
                path={`content_json.how_it_works.steps.${index}.icon`}
              />
              <Input
                placeholder="Step title"
                {...form.register(`content_json.how_it_works.steps.${index}.title`)}
              />
              <Textarea
                placeholder="Step text"
                {...form.register(`content_json.how_it_works.steps.${index}.text`)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => index > 0 && howItWorksSteps.move(index, index - 1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    index < howItWorksSteps.fields.length - 1 &&
                    howItWorksSteps.move(index, index + 1)
                  }
                  disabled={index === howItWorksSteps.fields.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => howItWorksSteps.remove(index)}
                  disabled={howItWorksSteps.fields.length <= 3}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {howItWorksSteps.fields.length < 4 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                howItWorksSteps.append({
                  title: "",
                  text: "",
                  icon: "sparkles"
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add optional fourth step
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Seasonal Specials" description="Feature seasonal products, selected special campaigns, and an optional image.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.seasonal.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.seasonal.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show Seasonal Specials section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Section title</Label>
            <Input {...form.register("content_json.seasonal.title")} />
          </div>
          <div className="space-y-2">
            <Label>Button text</Label>
            <Input {...form.register("content_json.seasonal.button_text")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Section subtitle</Label>
            <Textarea {...form.register("content_json.seasonal.subtitle")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Button link</Label>
            <Input {...form.register("content_json.seasonal.button_link")} />
          </div>
          <div className="md:col-span-2">
            <ImageField
              form={form}
              assets={assets}
              label="Seasonal section image"
              urlPath="content_json.seasonal.image_url"
              altPath="content_json.seasonal.image_alt"
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Selected seasonal products</p>
            {selectedSeasonalProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-[1.25rem] border border-border bg-white/80 p-4"
              >
                <p className="font-medium text-foreground">{product.name}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveSelection("content_json.seasonal.product_ids", index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveSelection("content_json.seasonal.product_ids", index, 1)}
                    disabled={index === selectedSeasonalProducts.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="grid gap-2 max-h-60 overflow-auto pr-1">
              {products
                .filter((product) => product.active && product.status === "active")
                .map((product) => {
                  const selected = seasonalProductIds.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        toggleSelection("content_json.seasonal.product_ids", product.id)
                      }
                      className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                        selected
                          ? "border-bakery-gold bg-bakery-gold/10"
                          : "border-border bg-white/70 hover:border-bakery-rose/40"
                      }`}
                    >
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.seasonal ? "Marked seasonal" : "Available product"}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Selected seasonal specials</p>
            {selectedSeasonalSpecials.map((special, index) => (
              <div
                key={special.id}
                className="flex items-center justify-between rounded-[1.25rem] border border-border bg-white/80 p-4"
              >
                <p className="font-medium text-foreground">{special.title}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveSelection("content_json.seasonal.special_ids", index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveSelection("content_json.seasonal.special_ids", index, 1)}
                    disabled={index === selectedSeasonalSpecials.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="grid gap-2 max-h-60 overflow-auto pr-1">
              {specials.map((special) => {
                const selected = seasonalSpecialIds.includes(special.id);
                return (
                  <button
                    key={special.id}
                    type="button"
                    onClick={() => toggleSelection("content_json.seasonal.special_ids", special.id)}
                    className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                      selected
                        ? "border-bakery-gold bg-bakery-gold/10"
                        : "border-border bg-white/70 hover:border-bakery-rose/40"
                    }`}
                  >
                    <p className="font-medium text-foreground">{special.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {special.subtitle ?? "Seasonal campaign"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Brand Message" description="Control the emotional brand copy, delivery messaging, urgency, and the supporting trust cards.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.trust.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.trust.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show Brand Promise section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>About / brand message</Label>
            <Textarea rows={8} {...form.register("content_json.home_content.about")} />
          </div>
          <div className="space-y-2">
            <Label>Delivery section copy</Label>
            <Textarea rows={6} {...form.register("content_json.home_content.delivery")} />
          </div>
          <div className="space-y-2">
            <Label>Urgency section copy</Label>
            <Textarea rows={6} {...form.register("content_json.home_content.urgency_section")} />
          </div>
        </div>
        <div className="space-y-4">
          {trustCards.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[180px_1fr_1.2fr_auto]"
            >
              <IconSelect form={form} path={`content_json.trust.cards.${index}.icon`} />
              <Input
                placeholder="Card title"
                {...form.register(`content_json.trust.cards.${index}.title`)}
              />
              <Textarea
                placeholder="Card text"
                {...form.register(`content_json.trust.cards.${index}.text`)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => index > 0 && trustCards.move(index, index - 1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    index < trustCards.fields.length - 1 && trustCards.move(index, index + 1)
                  }
                  disabled={index === trustCards.fields.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => trustCards.remove(index)}
                  disabled={trustCards.fields.length <= 3}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {trustCards.fields.length < 4 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                trustCards.append({
                  title: "",
                  text: "",
                  icon: "sparkles"
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add promise card
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Testimonials" description="Show a curated set of reviews on the homepage.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.testimonials.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.testimonials.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show testimonials section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="testimonials_heading">Section title</Label>
            <Input id="testimonials_heading" {...form.register("testimonials_heading")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="testimonials_description">Section subtitle</Label>
            <Textarea
              id="testimonials_description"
              {...form.register("testimonials_description")}
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Selected testimonials</p>
            {selectedTestimonials.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-border p-4 text-sm text-muted-foreground">
                No testimonials selected. Choose up to 3-6 customer quotes from the list.
              </div>
            ) : (
              selectedTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="flex items-center justify-between rounded-[1.25rem] border border-border bg-white/80 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{testimonial.customer_name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {testimonial.quote}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        moveSelection("content_json.testimonials.selected_ids", index, -1)
                      }
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        moveSelection("content_json.testimonials.selected_ids", index, 1)
                      }
                      disabled={index === selectedTestimonials.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="grid gap-2 max-h-[24rem] overflow-auto pr-1">
            {testimonials.map((testimonial) => {
              const selected = selectedTestimonialIds.includes(testimonial.id);
              return (
                <button
                  key={testimonial.id}
                  type="button"
                  onClick={() =>
                    toggleSelection("content_json.testimonials.selected_ids", testimonial.id)
                  }
                  className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                    selected
                      ? "border-bakery-gold bg-bakery-gold/10"
                      : "border-border bg-white/70 hover:border-bakery-rose/40"
                  }`}
                >
                  <p className="font-medium text-foreground">{testimonial.customer_name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {testimonial.quote}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Gallery" description="Add a visual grid from uploads, pasted URLs, or existing media library images.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.gallery.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.gallery.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show gallery section</span>
        </div>
        <div className="space-y-2">
          <Label>Section title</Label>
          <Input {...form.register("content_json.gallery.title")} />
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">Use between 6 and 12 images when possible for a fuller look.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              galleryImages.append({
                image_url: "",
                alt_text: "",
                title: "",
                caption: "",
                description: "",
                asset_id: null
              })
            }
            disabled={galleryImages.fields.length >= 12}
          >
            <Plus className="h-4 w-4" />
            Add gallery image
          </Button>
        </div>
        <div className="space-y-4">
          {galleryImages.fields.map((field, index) => (
            <GalleryImageEditor
              key={field.id}
              form={form}
              assets={assets}
              index={index}
              onMoveUp={() => index > 0 && galleryImages.move(index, index - 1)}
              onMoveDown={() =>
                index < galleryImages.fields.length - 1 && galleryImages.move(index, index + 1)
              }
              onRemove={() => galleryImages.remove(index)}
              disableMoveUp={index === 0}
              disableMoveDown={index === galleryImages.fields.length - 1}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="Close the homepage with a strong call-to-action and optional background image.">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={form.watch("content_json.final_cta.is_enabled")}
            onCheckedChange={(checked) =>
              form.setValue("content_json.final_cta.is_enabled", Boolean(checked), {
                shouldDirty: true
              })
            }
          />
          <span className="text-sm font-medium">Show final CTA section</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cta_heading">Section title</Label>
            <Input id="cta_heading" {...form.register("content_json.home_content.final_cta.title")} />
          </div>
          <div className="space-y-2">
            <Label>Button text</Label>
            <Input {...form.register("content_json.final_cta.button_text")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cta_description">Section text</Label>
            <Textarea id="cta_description" {...form.register("content_json.home_content.final_cta.text")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Button link</Label>
            <Input {...form.register("content_json.final_cta.button_link")} />
          </div>
          <div className="md:col-span-2">
            <ImageField
              form={form}
              assets={assets}
              label="CTA background image"
              urlPath="content_json.final_cta.background_image_url"
              altPath="content_json.final_cta.background_image_alt"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="gold" size="lg" disabled={isPending}>
          Save homepage
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset(homepage)}
          disabled={isPending}
        >
          Reset changes
        </Button>
      </div>
    </form>
  );
}

function GalleryImageEditor({
  form,
  assets,
  index,
  onMoveUp,
  onMoveDown,
  onRemove,
  disableMoveUp,
  disableMoveDown
}: {
  form: UseFormReturn<HomepageValues>;
  assets: MediaAssetRow[];
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  disableMoveUp: boolean;
  disableMoveDown: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputId = useId();
  const urlPath = `content_json.gallery.images.${index}.image_url` as const;
  const altPath = `content_json.gallery.images.${index}.alt_text` as const;

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-border p-4 lg:grid-cols-[220px_1fr]">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-[1.25rem] border border-border bg-white">
          <Image
            src={form.watch(urlPath) || "/products/placeholder-elegance.svg"}
            alt={form.watch(altPath) || "Gallery image preview"}
            fill
            sizes="220px"
            className="object-cover"
          />
        </div>
        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(fileInputId)?.click()}
            disabled={isUploading}
          >
            <ImagePlus className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload image"}
          </Button>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setIsUploading(true);
              try {
                const url = await uploadImage(file);
                form.setValue(urlPath, url, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                if (!form.getValues(altPath)?.trim()) {
                  form.setValue(altPath, file.name, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }
                toast.success("Gallery image uploaded");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Image upload failed");
              } finally {
                setIsUploading(false);
                event.target.value = "";
              }
            }}
          />
          <select
            className="flex h-11 w-full rounded-full border border-border bg-white/80 px-4 text-sm"
            defaultValue=""
            onChange={(event) => {
              const asset = assets.find((item) => item.id === event.target.value);
              if (!asset?.public_url) {
                return;
              }
              form.setValue(urlPath, asset.public_url, {
                shouldDirty: true,
                shouldValidate: true
              });
              form.setValue(
                `content_json.gallery.images.${index}.asset_id`,
                asset.id,
                { shouldDirty: true }
              );
              if (!form.getValues(altPath)?.trim()) {
                form.setValue(altPath, asset.file_name, {
                  shouldDirty: true,
                  shouldValidate: true
                });
              }
            }}
          >
            <option value="">Select from media library</option>
            {assets.slice(0, 24).map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.file_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <Input placeholder="Image URL" {...form.register(urlPath)} />
        <Input placeholder="Alt text" {...form.register(altPath)} />
        <Input
          placeholder="Title"
          {...form.register(`content_json.gallery.images.${index}.title`)}
        />
        <Input
          placeholder="Caption"
          {...form.register(`content_json.gallery.images.${index}.caption`)}
        />
        <Textarea
          placeholder="Extended description"
          {...form.register(`content_json.gallery.images.${index}.description`)}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={onMoveUp} disabled={disableMoveUp}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onMoveDown}
            disabled={disableMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
