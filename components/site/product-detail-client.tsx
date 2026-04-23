"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ProductWithRelations } from "@/lib/types/app";
import { getCartItemKey, useCartStore } from "@/lib/store/cart-store";
import { formatCurrency, resolveImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ProductDetailClient({ product }: { product: ProductWithRelations }) {
  const nutritionFacts = Array.isArray(product.nutrition_facts)
    ? product.nutrition_facts.filter(
        (
          fact
        ): fact is {
          label: string;
          value: string;
          daily_value?: string | null;
          sort_order?: number;
        } =>
          Boolean(
            fact &&
              typeof fact === "object" &&
              "label" in fact &&
              typeof fact.label === "string" &&
              "value" in fact &&
              typeof fact.value === "string"
          )
      )
    : [];
  const hasNutritionInfo =
    nutritionFacts.length > 0 ||
    Boolean(product.nutrition_serving_size) ||
    Boolean(product.nutrition_servings_per_container) ||
    Boolean(product.allergen_statement);
  const [selectedImage, setSelectedImage] = useState(
    resolveImageUrl(product.product_images.find((image) => image.is_primary)) ??
      resolveImageUrl(product.product_images[0]) ??
      "/products/placeholder-elegance.svg"
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.product_variants.find((variant) => variant.is_default)?.id ??
      product.product_variants[0]?.id ??
      null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant =
    product.product_variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedAddons = product.product_addons.filter((addon) =>
    selectedAddonIds.includes(addon.id)
  );

  const totalPrice = useMemo(
    () =>
      (selectedVariant?.price ?? product.base_price) +
      selectedAddons.reduce((sum, addon) => sum + addon.price, 0),
    [product.base_price, selectedVariant?.price, selectedAddons]
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="relative aspect-[1/1.05] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-card">
            <Image src={selectedImage} alt={product.name} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {product.product_images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImage(resolveImageUrl(image) ?? "/products/placeholder-elegance.svg")
                }
                className="relative aspect-square overflow-hidden rounded-[1.25rem] border border-white/70 bg-white"
              >
                <Image
                  src={resolveImageUrl(image) ?? "/products/placeholder-elegance.svg"}
                  alt={image.alt_text ?? product.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-7 p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                {product.categories?.name ?? "Signature Treat"}
              </p>
              <h1 className="mt-3 font-serif text-5xl text-foreground">{product.name}</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {product.description}
              </p>
            </div>

            {product.product_variants.length > 0 ? (
              <div className="space-y-3">
                <Label>Choose a size or box</Label>
                <div className="grid gap-3">
                  {product.product_variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                        selectedVariantId === variant.id
                          ? "border-bakery-rose bg-bakery-rose/10"
                          : "border-border bg-white/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium text-foreground">
                          {variant.name} ({variant.quantity} pcs)
                        </span>
                        <span className="text-sm font-medium text-bakery-rose">
                          {formatCurrency(variant.price)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.product_addons.length > 0 ? (
              <div className="space-y-3">
                <Label>Add-on finishes</Label>
                <div className="grid gap-3">
                  {product.product_addons.map((addon) => (
                    <label
                      key={addon.id}
                      className="flex items-start gap-3 rounded-[1.25rem] border border-border bg-white/80 p-4"
                    >
                      <Checkbox
                        checked={selectedAddonIds.includes(addon.id)}
                        onCheckedChange={(checked) =>
                          setSelectedAddonIds((current) =>
                            checked
                              ? [...current, addon.id]
                              : current.filter((id) => id !== addon.id)
                          )
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-foreground">{addon.name}</span>
                          <span className="text-sm text-muted-foreground">
                            +{formatCurrency(addon.price)}
                          </span>
                        </div>
                        {addon.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {addon.description}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-[1.5rem] bg-secondary/80 px-5 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Current selection</p>
                <p className="font-serif text-3xl text-bakery-rose">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full border border-border"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >
                  -
                </button>
                <span className="w-6 text-center text-lg font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="h-10 w-10 rounded-full border border-border"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  const cartItem = {
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: selectedImage,
                    unitPrice:
                      (selectedVariant?.price ?? product.base_price) +
                      selectedAddons.reduce((sum, addon) => sum + addon.price, 0),
                    quantity,
                    variantId: selectedVariant?.id ?? null,
                    variantName: selectedVariant?.name ?? null,
                    variantQuantity: selectedVariant?.quantity ?? null,
                    addons: selectedAddons.map((addon) => ({
                      id: addon.id,
                      name: addon.name,
                      price: addon.price
                    }))
                  };

                  addItem(cartItem);
                  toast.success("Added to cart", {
                    description: `Saved ${product.name} (${getCartItemKey(cartItem)}) to your cart.`
                  });
                })
              }
            >
              Add to cart
            </Button>
          </CardContent>
        </Card>
      </div>

      {hasNutritionInfo ? (
        <Card className="overflow-hidden border-white/70 bg-white/85">
          <CardContent className="grid gap-8 p-7 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                  Nutrition
                </p>
                <h2 className="mt-3 font-serif text-4xl text-foreground">Nutrition facts</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {product.nutrition_serving_size ? (
                  <p>
                    <span className="font-semibold text-foreground">Serving size:</span>{" "}
                    {product.nutrition_serving_size}
                  </p>
                ) : null}
                {product.nutrition_servings_per_container ? (
                  <p>
                    <span className="font-semibold text-foreground">Servings per container:</span>{" "}
                    {product.nutrition_servings_per_container}
                  </p>
                ) : null}
                {product.allergen_statement ? (
                  <p>
                    <span className="font-semibold text-foreground">Allergens:</span>{" "}
                    {product.allergen_statement}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-secondary/40 p-5">
              <div className="grid gap-3">
                {nutritionFacts.map((fact, index) => (
                  <div
                    key={`${fact.label}-${index}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border/60 pb-3 text-sm last:border-b-0 last:pb-0"
                  >
                    <span className="font-medium text-foreground">{fact.label}</span>
                    <span className="text-muted-foreground">{fact.value}</span>
                    <span className="min-w-16 text-right font-semibold text-bakery-rose">
                      {fact.daily_value ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
