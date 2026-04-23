"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCouponAction, upsertCouponAction } from "@/actions/admin";
import type { CouponRow } from "@/lib/types/app";
import { couponSchema, type CouponFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      minimum_order_amount: undefined,
      starts_at: "",
      ends_at: "",
      usage_limit: undefined,
      active: true
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertCouponAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Coupon updated" : "Coupon created");
      setEditing(null);
      form.reset();
    });
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit coupon" : "Create coupon"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input {...form.register("code")} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
                {...form.register("discount_type")}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input type="number" step="0.01" {...form.register("discount_value")} />
            </div>
            <div className="space-y-2">
              <Label>Minimum subtotal</Label>
              <Input type="number" step="0.01" {...form.register("minimum_order_amount")} />
            </div>
            <div className="space-y-2">
              <Label>Starts at</Label>
              <Input type="datetime-local" {...form.register("starts_at")} />
            </div>
            <div className="space-y-2">
              <Label>Ends at</Label>
              <Input type="datetime-local" {...form.register("ends_at")} />
            </div>
            <div className="space-y-2">
              <Label>Usage limit</Label>
              <Input type="number" {...form.register("usage_limit")} />
            </div>
            <label className="inline-flex items-center gap-3 pt-8 text-sm">
              <input type="checkbox" {...form.register("active")} />
              Active coupon
            </label>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input {...form.register("description")} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="gold" disabled={isPending}>
                Save coupon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>{coupon.code}</TableCell>
                  <TableCell>
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `$${coupon.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {coupon.usage_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(coupon);
                        form.reset({
                          id: coupon.id,
                          code: coupon.code,
                          description: coupon.description ?? "",
                          discount_type: coupon.discount_type,
                          discount_value: coupon.discount_value,
                          minimum_order_amount: coupon.minimum_order_amount ?? undefined,
                          starts_at: coupon.starts_at ?? "",
                          ends_at: coupon.ends_at ?? "",
                          usage_limit: coupon.usage_limit ?? undefined,
                          active: coupon.active
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
                          const result = await deleteCouponAction(coupon.id);
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Coupon deleted");
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
