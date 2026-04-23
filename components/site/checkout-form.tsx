"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createCheckoutSessionAction } from "@/actions/store";
import { useCartStore } from "@/lib/store/cart-store";
import { checkoutSchema, type CheckoutValues } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isPending, startTransition] = useTransition();
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      fulfillment_method: "pickup",
      fulfillment_date: "",
      fulfillment_time_slot: "",
      notes: "",
      coupon_code: "",
      delivery_address_line_1: "",
      delivery_address_line_2: "",
      delivery_city: "",
      delivery_state: "",
      delivery_zip: "",
      items
    }
  });

  const fulfillmentMethod = form.watch("fulfillment_method");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        ...values,
        items
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      clearCart();

      if (result.url) {
        window.location.href = result.url;
      }
    });
  });

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-5 p-8 text-center">
          <h2 className="font-serif text-4xl">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Add products to the cart before opening checkout.
          </p>
          <Button asChild variant="gold">
            <Link href="/shop">Shop now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Checkout
          </p>
          <CardTitle>Pickup or delivery details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="customer_name">Name</Label>
              <Input id="customer_name" {...form.register("customer_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input id="customer_phone" {...form.register("customer_phone")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input id="customer_email" type="email" {...form.register("customer_email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_method">Fulfillment</Label>
              <select
                id="fulfillment_method"
                className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
                {...form.register("fulfillment_method")}
              >
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_date">Date</Label>
              <Input id="fulfillment_date" type="date" {...form.register("fulfillment_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_time_slot">Preferred time</Label>
              <Input
                id="fulfillment_time_slot"
                placeholder="Ex. 2:00 PM - 4:00 PM"
                {...form.register("fulfillment_time_slot")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon_code">Coupon</Label>
              <Input id="coupon_code" placeholder="SAVE10" {...form.register("coupon_code")} />
            </div>
            {fulfillmentMethod === "delivery" ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_address_line_1">Address line 1</Label>
                  <Input
                    id="delivery_address_line_1"
                    {...form.register("delivery_address_line_1")}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_address_line_2">Address line 2</Label>
                  <Input
                    id="delivery_address_line_2"
                    {...form.register("delivery_address_line_2")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_city">City</Label>
                  <Input id="delivery_city" {...form.register("delivery_city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_state">State</Label>
                  <Input id="delivery_state" {...form.register("delivery_state")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_zip">ZIP</Label>
                  <Input id="delivery_zip" {...form.register("delivery_zip")} />
                </div>
              </>
            ) : null}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Order Notes</Label>
              <Textarea id="notes" {...form.register("notes")} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="gold" size="lg" disabled={isPending}>
                Continue to secure payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => {
            const itemTotal =
              item.unitPrice * item.quantity;

            return (
              <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty {item.quantity}
                    {item.variantName ? ` • ${item.variantName}` : ""}
                    {item.variantQuantity ? ` • ${item.variantQuantity} pcs` : ""}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(itemTotal)}</p>
              </div>
            );
          })}
          <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-serif text-3xl text-bakery-rose">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
