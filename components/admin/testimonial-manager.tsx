"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTestimonialAction, upsertTestimonialAction } from "@/actions/admin";
import type { TestimonialRow } from "@/lib/types/app";
import { testimonialSchema } from "@/lib/validations";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type TestimonialValues = z.infer<typeof testimonialSchema>;

export function TestimonialManager({ testimonials }: { testimonials: TestimonialRow[] }) {
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<TestimonialValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      customer_name: "",
      rating: 5,
      quote: "",
      occasion: "",
      featured: true,
      sort_order: 0
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertTestimonialAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Testimonial updated" : "Testimonial created");
      setEditing(null);
      form.reset();
    });
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit testimonial" : "Add testimonial"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Customer name</Label>
              <Input {...form.register("customer_name")} />
            </div>
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Input {...form.register("occasion")} />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Input type="number" min="1" max="5" {...form.register("rating")} />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input type="number" {...form.register("sort_order")} />
            </div>
            <div className="space-y-2">
              <Label>Quote</Label>
              <Textarea className="min-h-[160px]" {...form.register("quote")} />
            </div>
            <label className="inline-flex items-center gap-3 text-sm">
              <input type="checkbox" {...form.register("featured")} />
              Featured testimonial
            </label>
            <div>
              <Button type="submit" variant="gold" disabled={isPending}>
                Save testimonial
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Occasion</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell>{testimonial.customer_name}</TableCell>
                  <TableCell>{testimonial.rating}</TableCell>
                  <TableCell>{testimonial.occasion ?? "General"}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(testimonial);
                        form.reset({
                          id: testimonial.id,
                          customer_name: testimonial.customer_name,
                          rating: testimonial.rating,
                          quote: testimonial.quote,
                          occasion: testimonial.occasion ?? "",
                          featured: testimonial.featured,
                          sort_order: testimonial.sort_order
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
                          const result = await deleteTestimonialAction(testimonial.id);
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Testimonial deleted");
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
