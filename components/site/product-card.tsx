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

export function ProductCard({ product }: { product: ProductWithRelations }) {
  return (
    <Card className="group overflow-hidden border-white/70 bg-white/80">
      <div className="relative aspect-[4/4.7] overflow-hidden">
        <Image
          src={getPrimaryImage(product)}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {product.featured ? <Badge variant="gold">Featured</Badge> : null}
          {product.seasonal ? <Badge variant="rose">Seasonal</Badge> : null}
        </div>
      </div>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                {product.categories?.name ?? "Bakery Collection"}
              </p>
              <h3 className="mt-2 font-serif text-2xl text-foreground">{product.name}</h3>
            </div>
            <span className="text-lg font-semibold text-bakery-rose">
              {formatCurrency(getStartingPrice(product))}
            </span>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {product.short_description ?? product.description}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href={`/products/${product.slug}`}>
            View details
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
