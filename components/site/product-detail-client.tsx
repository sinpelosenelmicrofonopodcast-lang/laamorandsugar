"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ProductWithRelations } from "@/lib/types/app";
import { getCartItemKey, useCartStore } from "@/lib/store/cart-store";
import { getProductBadges, getProductStockState } from "@/lib/product-presentation";
import { formatCurrency, resolveImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function buildProductAlt(product: ProductWithRelations) {
  const category = product.categories?.name ?? "luxury dessert gift";
  return `${product.name} ${category} by L&A Amor & Sugar in Killeen Texas`;
}

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
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant =
    product.product_variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedAddons = product.product_addons.filter((addon) =>
    selectedAddonIds.includes(addon.id)
  );
  const isCustomCakePopProduct = product.hasCustomOptions &&
    [product.name, product.slug, product.categories?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .includes("cake pop");
  const badges = getProductBadges(product);
  const productStockState = getProductStockState(product);
  const selectedVariantSoldOut = selectedVariant?.stock_quantity === 0;
  const soldOut = productStockState.stock === 0 || selectedVariantSoldOut;
  const stockMessage = selectedVariantSoldOut
    ? "This size is currently sold out."
    : productStockState.message;

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
            <Image
              src={selectedImage}
              alt={buildProductAlt(product)}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
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
                  alt={image.alt_text ?? buildProductAlt(product)}
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
              {badges.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant={badge === "SOLD OUT" || badge === "SEASONAL" ? "rose" : "gold"}
                      className="animate-shimmer bg-[linear-gradient(110deg,rgba(255,255,255,0.88),rgba(197,155,69,0.22),rgba(255,255,255,0.88))] bg-[length:220%_100%] text-bakery-espresso shadow-sm"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <h1 className="mt-3 font-serif text-5xl text-foreground">{product.name}</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {product.description}
              </p>
              {stockMessage ? (
                <p className={`mt-4 rounded-[1rem] px-4 py-3 text-sm font-semibold ${
                  soldOut ? "bg-bakery-rose/10 text-bakery-rose" : "bg-bakery-gold/12 text-bakery-espresso"
                }`}>
                  {stockMessage}
                </p>
              ) : null}
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

            {product.hasCustomOptions ? (
              <div className="space-y-3">
                <Label>Custom options</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {product.customOptions.optionGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <Label htmlFor={`custom-option-${group.id}`}>{group.label}</Label>
                      <select
                        id={`custom-option-${group.id}`}
                        className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
                        value={selectedCustomOptions[group.id] ?? ""}
                        onChange={(event) =>
                          setSelectedCustomOptions((current) => ({
                            ...current,
                            [group.id]: event.target.value
                          }))
                        }
                      >
                        <option value="">No preference</option>
                        {group.values.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
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
              disabled={isPending || soldOut}
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
                    customOptions: Object.fromEntries(
                      product.customOptions.optionGroups
                        .map((group) => [group.label, selectedCustomOptions[group.id]] as const)
                        .filter(([, value]) => value)
                    ),
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
              {soldOut ? "Sold out" : "Add to cart"}
            </Button>
            <div className="rounded-[1.25rem] border border-bakery-gold/20 bg-bakery-gold/10 p-4 text-sm text-bakery-espresso">
              <p className="font-medium text-foreground">Secure checkout, local pickup, and delivery options</p>
              <p className="mt-1 text-muted-foreground">
                Perfect for Killeen, Fort Hood, Harker Heights, Belton, Temple, birthdays,
                teacher gifts, graduations, and custom sweet moments.
              </p>
            </div>
            {isCustomCakePopProduct ? (
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href={"/treat-designer" as Route}>Open Treat Designer</Link>
              </Button>
            ) : null}
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

      <Card className="overflow-hidden border-bakery-gold/20 bg-bakery-gold/10">
        <CardContent className="space-y-3 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Handcrafted with love 🤍
          </p>
          <p className="max-w-3xl text-sm leading-7 text-bakery-espresso">
            This food is made in a home kitchen and is not inspected by the Texas Department of
            State Health Services.
          </p>
        </CardContent>
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bakery-gold/20 bg-white/95 p-3 shadow-[0_-14px_40px_rgba(95,74,65,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
            <p className="text-sm font-semibold text-bakery-rose">{formatCurrency(totalPrice)}</p>
          </div>
          <Button
            variant="gold"
            className="shrink-0 rounded-full"
            disabled={isPending}
            aria-disabled={soldOut}
            onClick={() =>
              soldOut
                ? toast.error("Sold out", {
                    description: "This item is currently unavailable."
                  })
                :
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
                  customOptions: Object.fromEntries(
                    product.customOptions.optionGroups
                      .map((group) => [group.label, selectedCustomOptions[group.id]] as const)
                      .filter(([, value]) => value)
                  ),
                  addons: selectedAddons.map((addon) => ({
                    id: addon.id,
                    name: addon.name,
                    price: addon.price
                  }))
                };

                addItem(cartItem);
                toast.success("Added to cart");
              })
            }
          >
            {soldOut ? "Sold out" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
