"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { generateProductDescriptionAction } from "@/actions/store";
import { upsertProductAction } from "@/actions/admin";
import type { CategoryRow, ProductWithRelations } from "@/lib/types/app";
import { productSchema, type ProductFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

function getDefaultValues(product?: ProductWithRelations | null): ProductFormValues {
  return {
    id: product?.id,
    category_id: product?.category_id ?? null,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    nutrition_serving_size: product?.nutrition_serving_size ?? "",
    nutrition_servings_per_container: product?.nutrition_servings_per_container ?? "",
    nutrition_facts:
      (Array.isArray(product?.nutrition_facts) ? product?.nutrition_facts : []).map(
        (fact, index) => ({
          id:
            fact && typeof fact === "object" && "id" in fact && typeof fact.id === "string"
              ? fact.id
              : undefined,
          label:
            fact && typeof fact === "object" && "label" in fact && typeof fact.label === "string"
              ? fact.label
              : "",
          value:
            fact && typeof fact === "object" && "value" in fact && typeof fact.value === "string"
              ? fact.value
              : "",
          daily_value:
            fact &&
            typeof fact === "object" &&
            "daily_value" in fact &&
            typeof fact.daily_value === "string"
              ? fact.daily_value
              : "",
          sort_order:
            fact &&
            typeof fact === "object" &&
            "sort_order" in fact &&
            typeof fact.sort_order === "number"
              ? fact.sort_order
              : index
        })
      ) ?? [],
    allergen_statement: product?.allergen_statement ?? "",
    base_price: product?.base_price ?? 0,
    featured: product?.featured ?? false,
    seasonal: product?.seasonal ?? false,
    stock_quantity: product?.stock_quantity ?? 0,
    lead_time_days: product?.lead_time_days ?? 2,
    status: product?.status ?? "active",
    pickup_only: product?.pickup_only ?? false,
    delivery_available: product?.delivery_available ?? true,
    active: product?.active ?? true,
    images:
      product?.product_images.map((image) => ({
        id: image.id,
        image_url: image.image_url,
        alt_text: image.alt_text ?? "",
        sort_order: image.sort_order,
        is_primary: image.is_primary
      })) ?? [],
    variants:
      product?.product_variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        quantity: variant.quantity,
        price: variant.price,
        stock_quantity: variant.stock_quantity ?? 0,
        is_default: variant.is_default,
        sort_order: variant.sort_order
      })) ?? [],
    addons:
      product?.product_addons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        description: addon.description ?? "",
        price: addon.price,
        is_active: addon.is_active,
        sort_order: addon.sort_order
      })) ?? []
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function getFirstErrorMessage(errors: FieldErrors<ProductFormValues> | unknown): string | null {
  if (!errors || typeof errors !== "object") {
    return null;
  }

  if ("message" in errors && typeof errors.message === "string") {
    return errors.message;
  }

  if (Array.isArray(errors)) {
    for (const error of errors) {
      const message = getFirstErrorMessage(error);
      if (message) {
        return message;
      }
    }

    return null;
  }

  for (const error of Object.values(errors)) {
    const message = getFirstErrorMessage(error);
    if (message) {
      return message;
    }
  }

  return null;
}

export function ProductForm({
  categories,
  product
}: {
  categories: CategoryRow[];
  product?: ProductWithRelations | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(product)
  });
  const images = useFieldArray({ control: form.control, name: "images" });
  const variants = useFieldArray({ control: form.control, name: "variants" });
  const addons = useFieldArray({ control: form.control, name: "addons" });
  const nutritionFacts = useFieldArray({ control: form.control, name: "nutrition_facts" });
  const formErrorMessage =
    form.formState.submitCount > 0
      ? getFirstErrorMessage(form.formState.errors) ??
        (Object.keys(form.formState.errors).length > 0
          ? "Please review the highlighted fields before saving."
          : null)
      : null;

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await upsertProductAction(values);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(product ? "Product updated" : "Product created");
        router.push("/admin/products");
        router.refresh();
      });
    },
    (errors) => {
      toast.error(
        getFirstErrorMessage(errors) ?? "Please review the highlighted fields before saving."
      );
    }
  );

  const handleGenerate = () => {
    const name = form.getValues("name");
    const category = categories.find((item) => item.id === form.getValues("category_id"));

    startTransition(async () => {
      const result = await generateProductDescriptionAction({
        name,
        category: category?.name ?? "Bakery treat",
        flavor_notes: form.getValues("short_description"),
        seasonal: form.getValues("seasonal")
      });

      if (result.error || !result.data) {
        toast.error(result.error ?? "AI generation failed");
        return;
      }

      form.setValue("name", result.data.title);
      form.setValue("short_description", result.data.shortDescription);
      form.setValue("description", result.data.longDescription);
      toast.success("Product copy generated");
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const remainingSlots = 3 - images.fields.length;

    if (remainingSlots <= 0) {
      toast.error("You can only upload up to 3 images per product.");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES);

    if (oversizedFile) {
      toast.error(`"${oversizedFile.name}" is too large. Please use an image smaller than 4 MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploadingImages(true);

    try {
      for (const file of selectedFiles) {
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

        images.append({
          image_url: json.url,
          alt_text: form.getValues("name") || "Product image",
          sort_order: images.fields.length + form.getValues("images").length,
          is_primary: form.getValues("images").length === 0
        });
      }
      toast.success("Product images uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {formErrorMessage ? (
        <div className="rounded-[1.5rem] border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          We could not save the product yet. {formErrorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
              Product Details
            </p>
            <CardTitle>{product ? "Edit product" : "Create product"}</CardTitle>
          </div>
          <Button type="button" variant="outline" onClick={handleGenerate} disabled={isPending}>
            <WandSparkles className="h-4 w-4" />
            Generate description
          </Button>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register("slug")} />
            <FieldError message={form.formState.errors.slug?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
              {...form.register("category_id")}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...form.register("sku")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nutrition_serving_size">Serving size</Label>
            <Input
              id="nutrition_serving_size"
              placeholder="Ex. 2 strawberries"
              {...form.register("nutrition_serving_size")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nutrition_servings_per_container">Servings per container</Label>
            <Input
              id="nutrition_servings_per_container"
              placeholder="Ex. 3 servings"
              {...form.register("nutrition_servings_per_container")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Stock quantity</Label>
            <Input id="stock_quantity" type="number" {...form.register("stock_quantity")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead_time_days">Lead time (days)</Label>
            <Input id="lead_time_days" type="number" {...form.register("lead_time_days")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
              {...form.register("status")}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="short_description">Short description</Label>
            <Textarea id="short_description" className="min-h-[110px]" {...form.register("short_description")} />
            <FieldError message={form.formState.errors.short_description?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Long description</Label>
            <Textarea id="description" className="min-h-[180px]" {...form.register("description")} />
            <FieldError message={form.formState.errors.description?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="allergen_statement">Allergen statement</Label>
            <Input
              id="allergen_statement"
              placeholder="Ex. Contains milk, eggs, soy, and wheat"
              {...form.register("allergen_statement")}
            />
            <FieldError message={form.formState.errors.allergen_statement?.message} />
          </div>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            {[
              { name: "featured", label: "Featured" },
              { name: "seasonal", label: "Seasonal" },
              { name: "pickup_only", label: "Pickup only" },
              { name: "delivery_available", label: "Delivery available" },
              { name: "active", label: "Visible on storefront" }
            ].map((item) => (
              <label key={item.name} className="inline-flex items-center gap-3 text-sm">
                <Checkbox
                  checked={Boolean(form.watch(item.name as keyof ProductFormValues))}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      item.name as
                        | "featured"
                        | "seasonal"
                        | "pickup_only"
                        | "delivery_available"
                        | "active",
                      Boolean(checked)
                    )
                  }
                />
                {item.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Nutrition Facts</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the facts you want customers to see on the product page.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              nutritionFacts.append({
                label: "",
                value: "",
                daily_value: "",
                sort_order: nutritionFacts.fields.length
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add fact
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldError message={form.formState.errors.nutrition_facts?.message as string | undefined} />
          {nutritionFacts.fields.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
              Nutrition facts are optional, but adding them makes the product page more informative for clients.
            </div>
          ) : null}
          {nutritionFacts.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[1fr_180px_160px_120px_auto]"
            >
              <Input placeholder="Label" {...form.register(`nutrition_facts.${index}.label`)} />
              <Input placeholder="Value" {...form.register(`nutrition_facts.${index}.value`)} />
              <Input
                placeholder="% Daily Value"
                {...form.register(`nutrition_facts.${index}.daily_value`)}
              />
              <Input
                type="number"
                placeholder="Sort"
                {...form.register(`nutrition_facts.${index}.sort_order`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => nutritionFacts.remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="md:col-span-5 space-y-1">
                <FieldError
                  message={form.formState.errors.nutrition_facts?.[index]?.label?.message}
                />
                <FieldError
                  message={form.formState.errors.nutrition_facts?.[index]?.value?.message}
                />
                <FieldError
                  message={form.formState.errors.nutrition_facts?.[index]?.daily_value?.message}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Images</CardTitle>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleImageUpload(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.fields.length >= 3 || isUploadingImages}
            >
              <ImagePlus className="h-4 w-4" />
              {isUploadingImages ? "Uploading..." : "Upload images"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                images.fields.length < 3 &&
                images.append({
                  image_url: "",
                  alt_text: "",
                  sort_order: images.fields.length,
                  is_primary: images.fields.length === 0
                })
              }
              disabled={images.fields.length >= 3}
            >
              <Plus className="h-4 w-4" />
              Add URL
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldError message={form.formState.errors.images?.message as string | undefined} />
          <div className="rounded-[1.25rem] border border-dashed border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
            Upload or paste between 1 and 3 images. Exactly one must be marked as primary.
            Images must be smaller than 4 MB each for reliable uploads.
          </div>
          {images.fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[140px_1.2fr_0.8fr_120px_120px_auto]">
              <div className="relative aspect-square overflow-hidden rounded-[1rem] border border-border bg-white">
                <Image
                  src={form.watch(`images.${index}.image_url`) || "/products/placeholder-elegance.svg"}
                  alt={form.watch(`images.${index}.alt_text`) || "Product image preview"}
                  fill
                  className="object-cover"
                />
              </div>
              <Input placeholder="Image URL" {...form.register(`images.${index}.image_url`)} />
              <Input placeholder="Alt text" {...form.register(`images.${index}.alt_text`)} />
              <Input type="number" placeholder="Sort" {...form.register(`images.${index}.sort_order`)} />
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(form.watch(`images.${index}.is_primary`))}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      return;
                    }
                    images.fields.forEach((_, imageIndex) => {
                      form.setValue(`images.${imageIndex}.is_primary`, imageIndex === index, {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    });
                  }}
                />
                Primary
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const wasPrimary = Boolean(form.getValues(`images.${index}.is_primary`));
                  images.remove(index);
                  const remainingImages = form.getValues("images");
                  if (wasPrimary && remainingImages.length > 0) {
                    form.setValue("images.0.is_primary", true, {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="md:col-span-6 space-y-1">
                <FieldError message={form.formState.errors.images?.[index]?.image_url?.message} />
                <FieldError message={form.formState.errors.images?.[index]?.alt_text?.message} />
                <FieldError
                  message={form.formState.errors.images?.[index]?.sort_order?.message}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              variants.append({
                name: "",
                quantity: 6,
                price: 25,
                stock_quantity: 0,
                is_default: variants.fields.length === 0,
                sort_order: variants.fields.length
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldError message={form.formState.errors.variants?.message as string | undefined} />
          {variants.fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[1fr_140px_140px_140px_120px_auto]">
              <Input placeholder="Name" {...form.register(`variants.${index}.name`)} />
              <Input type="number" placeholder="Quantity" {...form.register(`variants.${index}.quantity`)} />
              <Input type="number" step="0.01" placeholder="Price" {...form.register(`variants.${index}.price`)} />
              <Input type="number" placeholder="Stock" {...form.register(`variants.${index}.stock_quantity`)} />
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(form.watch(`variants.${index}.is_default`))}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      return;
                    }
                    variants.fields.forEach((_, variantIndex) => {
                      form.setValue(`variants.${variantIndex}.is_default`, variantIndex === index, {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    });
                  }}
                />
                Default
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const wasDefault = Boolean(form.getValues(`variants.${index}.is_default`));
                  variants.remove(index);
                  const remainingVariants = form.getValues("variants");

                  if (wasDefault && remainingVariants.length > 0) {
                    form.setValue("variants.0.is_default", true, {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="md:col-span-6 space-y-1">
                <FieldError message={form.formState.errors.variants?.[index]?.name?.message} />
                <FieldError
                  message={form.formState.errors.variants?.[index]?.quantity?.message}
                />
                <FieldError message={form.formState.errors.variants?.[index]?.price?.message} />
                <FieldError
                  message={form.formState.errors.variants?.[index]?.stock_quantity?.message}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Add-ons</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              addons.append({
                name: "",
                description: "",
                price: 0,
                is_active: true,
                sort_order: addons.fields.length
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add add-on
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {addons.fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[1fr_1.3fr_140px_120px_auto]">
              <Input placeholder="Name" {...form.register(`addons.${index}.name`)} />
              <Input placeholder="Description" {...form.register(`addons.${index}.description`)} />
              <Input type="number" step="0.01" placeholder="Price" {...form.register(`addons.${index}.price`)} />
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(form.watch(`addons.${index}.is_active`))}
                  onCheckedChange={(checked) =>
                    form.setValue(`addons.${index}.is_active`, Boolean(checked))
                  }
                />
                Active
              </label>
              <Button type="button" variant="ghost" size="icon" onClick={() => addons.remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="md:col-span-5 space-y-1">
                <FieldError message={form.formState.errors.addons?.[index]?.name?.message} />
                <FieldError
                  message={form.formState.errors.addons?.[index]?.description?.message}
                />
                <FieldError message={form.formState.errors.addons?.[index]?.price?.message} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="gold" size="lg" disabled={isPending}>
          Save product
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
