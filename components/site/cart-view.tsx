"use client";

import Image from "next/image";
import Link from "next/link";

import { getCartItemKey, useCartStore } from "@/lib/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is ready for something sweet"
        description="Add a signature dessert box or build a custom event order to get started."
        action={
          <Button asChild variant="gold">
            <Link href="/shop">Browse treats</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {items.map((item) => {
          const key = getCartItemKey(item);
          const unitPrice =
            item.unitPrice;

          return (
            <Card key={key}>
              <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
                <div className="relative h-32 w-full overflow-hidden rounded-[1.5rem] sm:w-32">
                  <Image
                    src={item.image ?? "/products/placeholder-elegance.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-2xl text-foreground">{item.name}</h3>
                        {item.variantName ? (
                          <p className="text-sm text-muted-foreground">{item.variantName}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                        onClick={() => removeItem(key)}
                      >
                        Remove
                      </button>
                    </div>
                    {item.addons.length > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add-ons: {item.addons.map((addon) => addon.name).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-border"
                        onClick={() => updateQuantity(key, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-border"
                        onClick={() => updateQuantity(key, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-lg font-semibold text-bakery-rose">
                      {formatCurrency(unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="h-fit">
        <CardContent className="space-y-6 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-bakery-gold">
              Order summary
            </p>
            <h2 className="mt-3 font-serif text-4xl text-foreground">Almost ready</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated total</span>
              <span className="font-serif text-3xl text-bakery-rose">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
          <Button asChild variant="gold" size="lg" className="w-full">
            <Link href="/checkout">Proceed to checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
