"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { lookupOrderStatusAction } from "@/actions/order-communication";
import { type OrderLookupValues, orderLookupSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrderStatusLookupForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<OrderLookupValues>({
    resolver: zodResolver(orderLookupSchema),
    defaultValues: {
      order_number: "",
      email: "",
      phone: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await lookupOrderStatusAction(values);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  });

  return (
    <Card className="border-white/70 bg-white/80 shadow-card">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          Legacy order lookup
        </p>
        <CardTitle>Check an order placed before customer accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="order_number">Order number</Label>
            <Input id="order_number" placeholder="LAS-12345678" {...form.register("order_number")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" placeholder="(254) 555-1234" {...form.register("phone")} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="gold" size="lg" disabled={isPending}>
              View order status
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
