"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Trash2 } from "lucide-react";
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
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input {...form.register("image_url")} />
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
