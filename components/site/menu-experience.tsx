"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Gift,
  GraduationCap,
  Heart,
  Package,
  PartyPopper,
  Search,
  Sparkles,
  Star
} from "lucide-react";

import type { HomepageImageAsset, ProductWithRelations, TestimonialRow } from "@/lib/types/app";
import {
  getProductBadges,
  getProductDescription,
  getProductPerfectFor,
  getProductPrimaryImage,
  getProductStockState,
  getProductStartingPrice,
  matchesProductIntent
} from "@/lib/product-presentation";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const menuCollections = [
  { label: "Signature Berry Collection", query: "strawberry", icon: Heart },
  { label: "Luxury Treat Boxes", query: "box", icon: Package },
  { label: "Coffee Lover Collection", query: "coffee", icon: Coffee },
  { label: "Romantic Favorites", query: "romantic", icon: Heart },
  { label: "Birthday Favorites", query: "birthday", icon: Gift },
  { label: "Graduation Collection", query: "graduation", icon: GraduationCap },
  { label: "Teacher Appreciation", query: "teacher", icon: Star },
  { label: "Event & Party Treats", query: "event", icon: PartyPopper },
  { label: "Viral Favorites", query: "viral", icon: Sparkles },
  { label: "Seasonal Specials", query: "seasonal", icon: Sparkles },
  { label: "Just Because Collection", query: "just because", icon: Gift }
];

const filters = [
  { label: "Most Popular", value: "popular" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Gifts", value: "gifts" },
  { label: "Under $25", value: "under-25" },
  { label: "Chocolate Lovers", value: "chocolate" },
  { label: "Coffee Inspired", value: "coffee" },
  { label: "Trending", value: "trending" },
  { label: "New", value: "new" },
  { label: "Party Favorites", value: "party" }
];

function productMatchesFilter(product: ProductWithRelations, filter: string) {
  const price = getProductStartingPrice(product);

  switch (filter) {
    case "popular":
      return product.featured || getProductBadges(product).some((badge) => ["BEST SELLER", "MOST GIFTED"].includes(badge));
    case "seasonal":
      return product.seasonal;
    case "gifts":
      return matchesProductIntent(product, "gift") || getProductPerfectFor(product).length > 0;
    case "under-25":
      return price < 25;
    case "chocolate":
      return matchesProductIntent(product, "chocolate") || matchesProductIntent(product, "berry");
    case "coffee":
      return matchesProductIntent(product, "coffee") || matchesProductIntent(product, "latte");
    case "trending":
      return getProductBadges(product).some((badge) => ["VIRAL", "TRENDING", "BEST SELLER"].includes(badge)) || product.featured;
    case "new":
      return getProductBadges(product).includes("NEW");
    case "party":
      return matchesProductIntent(product, "party") || matchesProductIntent(product, "event");
    default:
      return true;
  }
}

function BrandedImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(145deg,rgba(255,250,246,0.98),rgba(248,217,221,0.74))] p-8 text-center">
      <div className="absolute left-8 top-8 h-2 w-2 rounded-full bg-bakery-gold/45" />
      <div className="absolute right-10 top-16 h-1.5 w-1.5 rounded-full bg-bakery-rose/45" />
      <Sparkles className="h-8 w-8 text-bakery-gold" />
      <p className="mt-4 font-serif text-3xl leading-tight text-bakery-espresso">{title}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-rose">
        Photo Coming Soon
      </p>
    </div>
  );
}

function MenuProductCard({ product }: { product: ProductWithRelations }) {
  const image = getProductPrimaryImage(product);
  const badges = getProductBadges(product);
  const stockState = getProductStockState(product);
  const perfectFor = getProductPerfectFor(product);

  return (
    <article className="group h-full overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,247,250,0.88))] shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_76px_rgba(120,85,63,0.16)]">
      <div className="relative aspect-[4/4.5] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.product_images[0]?.alt_text ?? product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <BrandedImageFallback title="L&A Amor & Sugar" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bakery-espresso/20 via-transparent to-white/5" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {badges.slice(0, 3).map((badge) => (
            <Badge
              key={badge}
              variant={badge === "SOLD OUT" || badge === "SEASONAL" ? "rose" : "gold"}
              className="animate-shimmer bg-[linear-gradient(110deg,rgba(255,255,255,0.9),rgba(197,155,69,0.2),rgba(255,255,255,0.9))] bg-[length:220%_100%] text-bakery-espresso"
            >
              {badge}
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
              {product.categories?.name ?? "Luxury Dessert Gift"}
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight text-foreground">
              {product.name}
            </h2>
          </div>
          <p className="text-lg font-semibold text-bakery-rose">
            {formatCurrency(getProductStartingPrice(product))}
          </p>
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bakery-gold">
            Perfect For
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {perfectFor.map((occasion) => (
              <span
                key={occasion}
                className="rounded-full bg-bakery-blush/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-bakery-espresso/80"
              >
                {occasion}
              </span>
            ))}
          </div>
        </div>
        <Button asChild variant="gold" className="w-full justify-between shadow-glow">
          <Link href={`/products/${product.slug}`}>
            {stockState.stock === 0 ? "View sold out item" : "Order this gift"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function MenuExperience({
  products,
  galleryImages,
  testimonials,
  treatDesignerEnabled = true
}: {
  products: ProductWithRelations[];
  galleryImages: HomepageImageAsset[];
  testimonials: TestimonialRow[];
  treatDesignerEnabled?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState("popular");
  const [activeCollection, setActiveCollection] = useState("all");
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = productMatchesFilter(product, activeFilter);
      const matchesCollection =
        activeCollection === "all" || matchesProductIntent(product, activeCollection);
      const matchesQuery =
        !query.trim() ||
        matchesProductIntent(product, query) ||
        product.name.toLowerCase().includes(query.toLowerCase());

      return matchesFilter && matchesCollection && matchesQuery;
    });
  }, [activeCollection, activeFilter, products, query]);

  const visibleProducts = filteredProducts.length > 0 ? filteredProducts : products;

  return (
    <div className="pb-24">
      <section className="container py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-stretch">
          <div className="fancy-border relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/84 p-8 shadow-[0_28px_80px_rgba(120,85,63,0.14)] sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,155,69,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(248,217,221,0.58),transparent_42%)]" />
            <div className="relative">
              <Badge variant="gold">Luxury dessert gifting in Killeen, TX</Badge>
              <h1 className="mt-7 max-w-4xl font-serif text-5xl leading-none text-foreground sm:text-6xl lg:text-7xl">
                Luxury Sweet Gifts Made to Impress
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Chocolate-covered strawberries, custom cake pops, dessert boxes, and handcrafted treats designed for unforgettable moments.
              </p>
              <p className="mt-4 max-w-2xl text-base italic leading-7 text-foreground/80">
                Because flowers are nice... but edible ones? unforgettable.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="gold" size="lg" className="shadow-glow">
                  <Link href="/shop">Order Now</Link>
                </Button>
                {treatDesignerEnabled ? (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/treat-designer">Design Your Own Treat</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/custom-orders">Start Custom Order</Link>
                  </Button>
                )}
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {[
                  "Limited handcrafted availability this week",
                  "Orders may sell out during holidays",
                  "2-3 day notice recommended",
                  "Reserve your spot early"
                ].map((item) => (
                  <div key={item} className="rounded-full border border-white/80 bg-white/75 px-4 py-3 text-sm font-semibold text-bakery-espresso">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative min-h-[440px] overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,244,247,0.96),rgba(255,255,255,0.84))] shadow-card">
            {galleryImages[0]?.image_url ? (
              <Image
                src={galleryImages[0].image_url}
                alt={galleryImages[0].alt_text}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <BrandedImageFallback title="Luxury Sweet Gifts" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bakery-espresso/25 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[1.6rem] border border-white/75 bg-white/95 p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                Gift-ready presentation
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-foreground">
                Styled to be opened, photographed, shared, and remembered.
              </h2>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid gap-4 rounded-[2rem] border border-white/75 bg-white/82 p-4 shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search berries, coffee pops, teacher gifts..."
              aria-label="Search the L&A Amor & Sugar menu"
              className="h-12 w-full rounded-full border border-bakery-gold/20 bg-white/90 px-11 text-sm outline-none transition focus:ring-2 focus:ring-bakery-rose/35"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  activeFilter === filter.value
                    ? "bg-bakery-gold text-white shadow-glow"
                    : "bg-white/80 text-bakery-espresso hover:-translate-y-0.5 hover:bg-bakery-blush/35"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex gap-3 overflow-x-auto pb-3">
          <button
            type="button"
            onClick={() => setActiveCollection("all")}
            className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeCollection === "all" ? "bg-bakery-espresso text-white" : "bg-white/82 text-bakery-espresso"
            }`}
          >
            All Collections
          </button>
          {menuCollections.map((collection) => {
            const Icon = collection.icon;

            return (
              <button
                key={collection.label}
                type="button"
                onClick={() => setActiveCollection(collection.query)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeCollection === collection.query
                    ? "bg-bakery-rose text-white shadow-glow"
                    : "bg-white/82 text-bakery-espresso hover:-translate-y-0.5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {collection.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="container py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bakery-gold">
              Curated Menu
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              Giftable treats for every sweet moment
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {visibleProducts.length} luxury dessert gifts
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <MenuProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {treatDesignerEnabled ? (
      <section className="container py-16 sm:py-20">
        <div className="grid gap-8 rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,247,0.84),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge variant="rose">Premium personalization</Badge>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              Design Your Own Treat
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Choose your treats, colors, drizzle, sprinkles, edible logo, and luxury packaging.
            </p>
          </div>
          <Button asChild variant="gold" size="lg" className="shadow-glow">
            <Link href="/treat-designer">Open Treat Designer</Link>
          </Button>
        </div>
      </section>
      ) : null}

      <section className="container py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <Badge variant="gold">Real Sweet Moments</Badge>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              A Look at Our Sweet Creations
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Customer images, recent creations, and Instagram-style dessert gift inspiration from our Killeen sweet boutique.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(galleryImages.length > 0 ? galleryImages : []).slice(0, 6).map((image, index) => (
              <div
                key={`${image.image_url}-${index}`}
                className="group relative aspect-[4/4.6] overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/85 shadow-card"
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.05]"
                />
              </div>
            ))}
            {galleryImages.length === 0
              ? ["Dessert box", "Dipped berries", "Custom cake pops"].map((label) => (
                  <div key={label} className="relative aspect-[4/4.6] overflow-hidden rounded-[1.75rem] border border-white/75 shadow-card">
                    <BrandedImageFallback title={label} />
                  </div>
                ))
              : null}
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="rose">Why customers love us</Badge>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              Sweet words after unforgettable gifts
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((testimonial) => (
              <article key={testimonial.id} className="rounded-[1.75rem] border border-white/75 bg-white/84 p-6 shadow-card">
                <div className="flex gap-1 text-bakery-gold">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">“{testimonial.quote}”</p>
                <p className="mt-6 font-semibold text-foreground">{testimonial.customer_name}</p>
                {testimonial.occasion ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-bakery-gold">
                    {testimonial.occasion}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
