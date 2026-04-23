"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteSeasonalSpecialAction, upsertSeasonalSpecialAction } from "@/actions/admin";
import type { SeasonalSpecialRow } from "@/lib/types/app";
import { seasonalSpecialSchema } from "@/lib/validations";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SpecialValues = z.infer<typeof seasonalSpecialSchema>;

export function SpecialsManager({ specials }: { specials: SeasonalSpecialRow[] }) {
  const [editing, setEditing] = useState<SeasonalSpecialRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<SpecialValues>({
    resolver: zodResolver(seasonalSpecialSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      cta_label: "",
      cta_href: "",
      image_url: "",
      starts_at: "",
      ends_at: "",
      is_active: true
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertSeasonalSpecialAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Seasonal special updated" : "Seasonal special created");
      setEditing(null);
      form.reset();
    });
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit seasonal special" : "Create seasonal special"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input {...form.register("subtitle")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <Label>CTA label</Label>
              <Input {...form.register("cta_label")} />
            </div>
            <div className="space-y-2">
              <Label>CTA href</Label>
              <Input {...form.register("cta_href")} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input {...form.register("image_url")} />
            </div>
            <div className="space-y-2">
              <Label>Starts at</Label>
              <Input type="datetime-local" {...form.register("starts_at")} />
            </div>
            <div className="space-y-2">
              <Label>Ends at</Label>
              <Input type="datetime-local" {...form.register("ends_at")} />
            </div>
            <label className="inline-flex items-center gap-3 text-sm">
              <input type="checkbox" {...form.register("is_active")} />
              Active special
            </label>
            <div>
              <Button type="submit" variant="gold" disabled={isPending}>
                Save special
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Scheduled specials</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {specials.map((special) => (
                <TableRow key={special.id}>
                  <TableCell>{special.title}</TableCell>
                  <TableCell>{new Date(special.starts_at).toLocaleDateString("en-US")}</TableCell>
                  <TableCell>{new Date(special.ends_at).toLocaleDateString("en-US")}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(special);
                        form.reset({
                          id: special.id,
                          title: special.title,
                          subtitle: special.subtitle ?? "",
                          description: special.description ?? "",
                          cta_label: special.cta_label ?? "",
                          cta_href: special.cta_href ?? "",
                          image_url: special.image_url ?? "",
                          starts_at: special.starts_at.slice(0, 16),
                          ends_at: special.ends_at.slice(0, 16),
                          is_active: special.is_active
                        });
                      }}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteSeasonalSpecialAction(special.id);
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Special deleted");
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
