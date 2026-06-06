import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import type { ProductWithRelations } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";
import {
  getProductBadges,
  getProductDescription,
  getProductPerfectFor,
  getProductPrimaryImage,
  getProductStockState,
  getProductStartingPrice
} from "@/lib/product-presentation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProductCard({
  product,
  ctaLabel = "View details"
}: {
  product: ProductWithRelations;
  ctaLabel?: string;
}) {
  const primaryImage = getProductPrimaryImage(product);
  const badges = getProductBadges(product);
  const stockState = getProductStockState(product);
  const perfectFor = getProductPerfectFor(product);
  const imageAlt = `${product.name} ${product.categories?.name ?? "luxury dessert gift"} in Killeen Texas by L&A Amor & Sugar`;

  return (
    <Card className="group h-full overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,247,250,0.86))] shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_76px_rgba(120,85,63,0.16)]">
      <div className="relative aspect-[4/4.55] overflow-hidden bg-[linear-gradient(145deg,rgba(255,250,246,0.98),rgba(248,217,221,0.72))]">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="absolute left-8 top-8 h-2 w-2 rounded-full bg-bakery-gold/45" />
            <div className="absolute right-10 top-16 h-1.5 w-1.5 rounded-full bg-bakery-rose/45" />
            <div className="absolute bottom-12 left-14 h-1.5 w-1.5 rounded-full bg-bakery-gold/35" />
            <Sparkles className="h-8 w-8 text-bakery-gold" />
            <p className="mt-4 font-serif text-3xl leading-tight text-bakery-espresso">
              L&A Amor & Sugar
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-rose">
              Photo coming soon
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bakery-espresso/18 via-transparent to-white/5" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {badges.slice(0, 3).map((badge) => (
            <Badge
              key={badge}
              variant={badge === "SOLD OUT" || badge === "SEASONAL" ? "rose" : "gold"}
              className="animate-shimmer bg-[linear-gradient(110deg,rgba(255,255,255,0.88),rgba(197,155,69,0.22),rgba(255,255,255,0.88))] bg-[length:220%_100%] text-bakery-espresso shadow-sm"
            >
              {badge}
            </Badge>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(255,250,246,0.2)] to-transparent" />
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                {product.categories?.name ?? "Signature Collection"}
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight text-foreground transition group-hover:text-bakery-rose">
                {product.name}
              </h3>
            </div>
            <span className="text-lg font-semibold text-bakery-rose">
              {formatCurrency(getProductStartingPrice(product))}
            </span>
          </div>
          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
            {getProductDescription(product)}
          </p>
          {stockState.message ? (
            <p className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
              stockState.stock === 0
                ? "bg-bakery-rose/10 text-bakery-rose"
                : "bg-bakery-gold/12 text-bakery-espresso"
            }`}>
              {stockState.message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {perfectFor.map((occasion) => (
              <span
                key={occasion}
                className="rounded-full bg-bakery-blush/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-bakery-espresso/80"
              >
                {occasion}
              </span>
            ))}
          </div>
        </div>
        <Button asChild variant="gold" className="w-full justify-between rounded-full shadow-glow">
          <Link href={`/products/${product.slug}`}>
            {stockState.stock === 0 ? "View sold out item" : ctaLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
