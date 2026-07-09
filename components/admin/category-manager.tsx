"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, PencilLine, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { deleteCategoryAction, upsertCategoryAction } from "@/actions/admin";
import type { CategoryFormValues } from "@/lib/validations";
import { categorySchema } from "@/lib/validations";
import type { CategoryRow } from "@/lib/types/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image_url: "",
      sort_order: 0
    }
  });
  const imageUrl = form.watch("image_url");

  const handleEdit = (category: CategoryRow) => {
    setEditing(category);
    form.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image_url: category.image_url ?? "",
      sort_order: category.sort_order
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertCategoryAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Category updated" : "Category created");
      setEditing(null);
      form.reset({ name: "", slug: "", description: "", image_url: "", sort_order: 0 });
    });
  });

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "admin/categories");

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData
      });
      const json = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Upload failed.");
      }

      form.setValue("image_url", json.url, { shouldDirty: true, shouldValidate: true });
      toast.success("Category image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit category" : "Add category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...form.register("slug")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea className="min-h-[120px]" {...form.register("description")} />
            </div>
            <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label htmlFor="category-image-upload">Collection image</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload the image this collection card should display. This never pulls from products.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild disabled={uploadingImage}>
                    <label htmlFor="category-image-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Uploading..." : imageUrl ? "Replace image" : "Upload image"}
                    </label>
                  </Button>
                  {imageUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        form.setValue("image_url", "", { shouldDirty: true, shouldValidate: true })
                      }
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <input
                id="category-image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingImage}
                onChange={(event) => {
                  void handleImageUpload(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <div className="relative aspect-video overflow-hidden rounded-xl bg-[#F9F6F2]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Selected collection preview"
                    fill
                    sizes="(min-width: 1280px) 38vw, 90vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-7 w-7" />
                    No collection image assigned
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="Uploaded image URL appears here"
                  {...form.register("image_url")}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: paste a media library URL only when needed. Upload is preferred.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input type="number" {...form.register("sort_order")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="gold" disabled={isPending}>
                Save category
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    form.reset({
                      name: "",
                      slug: "",
                      description: "",
                      image_url: "",
                      sort_order: 0
                    });
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteCategoryAction(category.id);
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Category deleted");
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
