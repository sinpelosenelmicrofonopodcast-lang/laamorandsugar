import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ProductWithRelations } from "@/lib/types/app";
import { formatCurrency, resolveImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getPrimaryImage(product: ProductWithRelations) {
  return (
    resolveImageUrl(product.product_images.find((image) => image.is_primary)) ??
    resolveImageUrl(product.product_images[0]) ??
    "/products/placeholder-elegance.svg"
  );
}

function getStartingPrice(product: ProductWithRelations) {
  return (
    product.product_variants.find((variant) => variant.is_default)?.price ??
    product.product_variants[0]?.price ??
    product.base_price
  );
}

function getOptionalTag(product: ProductWithRelations) {
  const candidate = (product as ProductWithRelations & { tag?: unknown }).tag;
  return typeof candidate === "string" && candidate.trim().length > 0
    ? candidate.trim()
    : null;
}

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const optionalTag = getOptionalTag(product);

  return (
    <Card className="group overflow-hidden border-white/70 bg-white/88 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(120,85,63,0.13)]">
      <div className="relative aspect-[4/4.7] overflow-hidden">
        <Image
          src={getPrimaryImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {optionalTag ? <Badge className="bg-white/92 text-foreground">{optionalTag}</Badge> : null}
          {product.featured ? <Badge variant="gold">Featured</Badge> : null}
          {product.seasonal ? <Badge variant="rose">Seasonal</Badge> : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(255,250,246,0.2)] to-transparent" />
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                {product.categories?.name ?? "Bakery Collection"}
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight text-foreground transition group-hover:text-bakery-rose">
                {product.name}
              </h3>
            </div>
            <span className="text-lg font-semibold text-bakery-rose">
              {formatCurrency(getStartingPrice(product))}
            </span>
          </div>
          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
            {product.short_description ?? product.description}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full justify-between rounded-full">
          <Link href={`/products/${product.slug}`}>
            View details
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
