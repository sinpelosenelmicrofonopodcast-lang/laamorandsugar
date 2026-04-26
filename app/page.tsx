import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Gift,
  Heart,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck
} from "lucide-react";

import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";
import type {
  HomepageIconName,
  HomepageImageAsset,
  HomepageSectionKey,
  ProductWithRelations,
  SeasonalSpecialRow,
  TestimonialRow
} from "@/lib/types/app";
import {
  getActiveSeasonalSpecials,
  getHomepageContent,
  getMediaAssets,
  getProducts,
  getTestimonials
} from "@/lib/data/queries";

const homepageIconMap: Record<HomepageIconName, LucideIcon> = {
  calendar: CalendarDays,
  gift: Gift,
  heart: Heart,
  package: Package,
  palette: Palette,
  shield: ShieldCheck,
  shopping_bag: ShoppingBag,
  sparkles: Sparkles,
  star: Star,
  truck: Truck
};

function sortByIdOrder<T extends { id: string }>(items: T[], ids: string[]) {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
}

function getSelectedProducts(products: ProductWithRelations[], ids: string[], fallback: ProductWithRelations[]) {
  if (ids.length === 0) {
    return fallback;
  }

  return sortByIdOrder(
    products.filter((product) => ids.includes(product.id)),
    ids
  );
}

function getSelectedSpecials(specials: SeasonalSpecialRow[], ids: string[]) {
  if (ids.length === 0) {
    return specials;
  }

  return sortByIdOrder(
    specials.filter((special) => ids.includes(special.id)),
    ids
  );
}

function getSelectedTestimonials(testimonials: TestimonialRow[], ids: string[]) {
  if (ids.length === 0) {
    return testimonials.slice(0, 3);
  }

  return sortByIdOrder(
    testimonials.filter((testimonial) => ids.includes(testimonial.id)),
    ids
  );
}

function mapMediaAssetsToGallery(
  assets: {
    id: string;
    public_url: string | null;
    file_name: string;
  }[]
): HomepageImageAsset[] {
  return assets
    .filter((asset) => asset.public_url)
    .slice(0, 8)
    .map((asset) => ({
      image_url: asset.public_url as string,
      alt_text: asset.file_name,
      title: asset.file_name,
      caption: null,
      description: null,
      asset_id: asset.id
    }));
}

export async function generateMetadata() {
  const homepage = await getHomepageContent();

  return buildMetadata({
    title: homepage.seo_title ?? "L&A Amor & Sugar | Custom Desserts & Sweet Treats in Killeen, TX",
    description:
      homepage.seo_description ??
      "Custom desserts, chocolate-covered strawberries, cake pops, dessert boxes, and seasonal treats made with love in Killeen, TX. Order online or request a custom treat box.",
    path: "/"
  });
}

export default async function HomePage() {
  const [homepage, allProducts, testimonials, specials, mediaAssets] = await Promise.all([
    getHomepageContent(),
    getProducts(),
    getTestimonials(),
    getActiveSeasonalSpecials(),
    getMediaAssets()
  ]);

  const featuredFallback = allProducts.filter((product) => product.featured).slice(0, 6);
  const featuredProducts = getSelectedProducts(
    allProducts,
    homepage.content_json.featured.product_ids,
    featuredFallback.length > 0 ? featuredFallback : allProducts.slice(0, 6)
  );
  const seasonalProducts = getSelectedProducts(
    allProducts.filter((product) => product.seasonal),
    homepage.content_json.seasonal.product_ids,
    allProducts.filter((product) => product.seasonal).slice(0, 4)
  );
  const selectedSpecials = getSelectedSpecials(
    specials,
    homepage.content_json.seasonal.special_ids
  );
  const selectedTestimonials = getSelectedTestimonials(
    testimonials,
    homepage.content_json.testimonials.selected_ids
  ).slice(0, 3);
  const galleryImages =
    homepage.content_json.gallery.images.length > 0
      ? homepage.content_json.gallery.images
      : mapMediaAssetsToGallery(mediaAssets);

  const heroPrimaryHref = homepage.hero_primary_cta_href ?? "/shop";
  const heroPrimaryLabel = homepage.hero_primary_cta_label ?? "Shop Treats";
  const heroSecondaryHref = homepage.hero_secondary_cta_href ?? "/custom-orders";
  const heroSecondaryLabel = homepage.hero_secondary_cta_label ?? "Start Custom Order";

  const sectionNodes: Partial<Record<HomepageSectionKey, React.ReactNode>> = {
    featured:
      homepage.content_json.featured.is_enabled && featuredProducts.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Best Sellers"
              title={homepage.featured_heading ?? "Best Sellers"}
              description={
                homepage.featured_description ??
                "Our most-loved treats, perfect for gifts, events, or treating yourself."
              }
            />
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/shop">Browse all treats</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} ctaLabel="View Product" />
            ))}
          </div>
        </section>
      ) : null,
    custom_orders: homepage.content_json.custom_orders.is_enabled ? (
      <section className="container py-16 sm:py-20">
        <Card className="overflow-hidden border-white/70 bg-white/86 shadow-card">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.92fr_1.08fr] lg:p-10">
            <div className="relative min-h-[320px] overflow-hidden rounded-[1.85rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,244,247,0.98),rgba(255,255,255,0.82))]">
              {homepage.content_json.custom_orders.image_url ? (
                <Image
                  src={homepage.content_json.custom_orders.image_url}
                  alt={homepage.content_json.custom_orders.image_alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,217,221,0.7),transparent_52%),linear-gradient(135deg,rgba(255,249,244,0.98),rgba(255,255,255,0.84))]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 rounded-full bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold backdrop-blur">
                Custom desserts
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <SectionHeading
                eyebrow="Made for your moment"
                title={homepage.content_json.custom_orders.title}
                description={homepage.content_json.custom_orders.description}
              />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {homepage.content_json.custom_orders.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[1.35rem] border border-border/70 bg-white/85 px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button asChild variant="gold" size="lg">
                  <a href={homepage.content_json.custom_orders.button_link}>
                    {homepage.content_json.custom_orders.button_text}
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    ) : null,
    how_it_works: homepage.content_json.how_it_works.is_enabled ? (
      <section className="container py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <SectionHeading
            eyebrow="How It Works"
            title={homepage.process_heading ?? homepage.content_json.how_it_works.title}
            description={homepage.process_description ?? undefined}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {homepage.content_json.how_it_works.steps.map((step, index) => {
              const Icon = homepageIconMap[step.icon] ?? Sparkles;
              return (
                <Card key={`${step.title}-${index}`} className="border-white/70 bg-white/85">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-bakery-gold" />
                      <span className="text-xs font-semibold uppercase tracking-[0.26em] text-bakery-gold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 font-serif text-3xl leading-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    ) : null,
    seasonal:
      homepage.content_json.seasonal.is_enabled &&
      (selectedSpecials.length > 0 || seasonalProducts.length > 0) ? (
        <section className="container py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr]">
            <Card className="overflow-hidden border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(248,217,221,0.5))] shadow-card">
              <CardContent className="space-y-6 p-8">
                <SectionHeading
                  eyebrow="Seasonal Specials"
                  title={homepage.content_json.seasonal.title}
                  description={homepage.content_json.seasonal.subtitle}
                />
                {homepage.content_json.seasonal.image_url ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
                    <Image
                      src={homepage.content_json.seasonal.image_url}
                      alt={homepage.content_json.seasonal.image_alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                ) : null}
                {selectedSpecials[0] ? (
                  <div className="rounded-[1.6rem] border border-white/70 bg-white/82 p-5">
                    <Badge variant="rose">Limited time</Badge>
                    <h3 className="mt-3 font-serif text-3xl text-foreground">
                      {selectedSpecials[0].title}
                    </h3>
                    {selectedSpecials[0].description ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {selectedSpecials[0].description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <Button asChild variant="gold">
                  <a href={homepage.content_json.seasonal.button_link}>
                    {homepage.content_json.seasonal.button_text}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
              {seasonalProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} ctaLabel="View Product" />
              ))}
            </div>
          </div>
        </section>
      ) : null,
    trust: homepage.content_json.trust.is_enabled ? (
      <section className="container py-16 sm:py-20">
        <SectionHeading
          eyebrow="Our Promise"
          title={homepage.content_json.trust.title}
          description={homepage.content_json.trust.description || undefined}
          align="center"
          className="mx-auto max-w-3xl"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homepage.content_json.trust.cards.map((card) => {
            const Icon = homepageIconMap[card.icon] ?? Sparkles;
            return (
              <Card key={card.title} className="border-white/70 bg-white/85 shadow-card">
                <CardContent className="p-6">
                  <Icon className="h-6 w-6 text-bakery-gold" />
                  <h3 className="mt-5 font-serif text-3xl text-foreground">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    ) : null,
    testimonials:
      homepage.content_json.testimonials.is_enabled && selectedTestimonials.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <SectionHeading
            eyebrow="Testimonials"
            title={homepage.testimonials_heading ?? "Sweet Words From Our Customers"}
            description={homepage.testimonials_description ?? undefined}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {selectedTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </section>
      ) : null,
    gallery:
      homepage.content_json.gallery.is_enabled && galleryImages.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <SectionHeading
            eyebrow="Gallery"
            title={homepage.content_json.gallery.title}
            description="A look at the treat boxes, dipped sweets, and custom details our clients love most."
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galleryImages.slice(0, 12).map((image, index) => (
              <div
                key={`${image.image_url}-${index}`}
                className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 shadow-card"
              >
                <div className="relative aspect-[4/4.5] overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.05]"
                  />
                </div>
                {(image.title || image.caption) ? (
                  <div className="space-y-1 p-4">
                    {image.title ? (
                      <p className="font-medium text-foreground">{image.title}</p>
                    ) : null}
                    {image.caption ? (
                      <p className="text-sm text-muted-foreground">{image.caption}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null,
    final_cta: homepage.content_json.final_cta.is_enabled ? (
      <section className="container py-16 sm:py-20">
        <Card className="overflow-hidden border-white/70 shadow-card">
          <CardContent className="relative p-8 lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,251,247,0.95),rgba(248,217,221,0.65),rgba(197,155,69,0.12))]" />
            {homepage.content_json.final_cta.background_image_url ? (
              <Image
                src={homepage.content_json.final_cta.background_image_url}
                alt={homepage.content_json.final_cta.background_image_alt}
                fill
                className="object-cover opacity-18"
                sizes="100vw"
              />
            ) : null}
            <div className="relative mx-auto max-w-3xl text-center">
              <SectionHeading
                eyebrow="Start Your Order"
                title={homepage.cta_heading ?? homepage.content_json.final_cta.title}
                description={homepage.cta_description ?? homepage.content_json.final_cta.text}
                align="center"
                className="mx-auto max-w-3xl"
              />
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild variant="gold" size="lg">
                  <a href={homepage.content_json.final_cta.button_link}>
                    {homepage.content_json.final_cta.button_text}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/shop">Browse Treats</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <Link href="/reviews" className="transition hover:text-bakery-rose">
                  Reviews
                </Link>
                <Link href="/faq" className="transition hover:text-bakery-rose">
                  FAQ
                </Link>
                <Link href="/contact" className="transition hover:text-bakery-rose">
                  Contact
                </Link>
                <Link href="/custom-orders" className="transition hover:text-bakery-rose">
                  Custom Orders
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    ) : null
  };

  return (
    <div className="pb-24">
      <section className="container py-14 sm:py-18 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
          <div className="fancy-border relative overflow-hidden rounded-[2.75rem] border border-white/60 bg-white/80 p-8 shadow-[0_28px_80px_rgba(120,85,63,0.14)] backdrop-blur sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,155,69,0.17),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(248,217,221,0.55),transparent_38%)]" />
            {homepage.hero_background_image_url ? (
              <Image
                src={homepage.hero_background_image_url}
                alt={homepage.hero_background_image_alt ?? "Soft luxury dessert background"}
                fill
                priority
                className="object-cover opacity-10"
                sizes="100vw"
              />
            ) : null}
            <div className="relative">
              <div className="mb-8 max-w-[34rem]">
                <div className="relative h-24 w-full sm:h-28">
                  <Image
                    src="/brand/la-logo-official.png"
                    alt="L&A Amor & Sugar Co."
                    fill
                    priority
                    className="object-contain object-left"
                  />
                </div>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Badge variant="gold">
                  {homepage.hero_eyebrow ?? "Custom sweets made with love in Killeen, TX"}
                </Badge>
                <span className="rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-espresso/80">
                  Gift-ready treats for every sweet moment
                </span>
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-none tracking-tight text-foreground sm:text-6xl">
                {homepage.hero_title ?? "Luxury Custom Desserts for Every Sweet Moment"}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {homepage.hero_description}
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="gold" size="lg">
                  <a href={heroPrimaryHref}>{heroPrimaryLabel}</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={heroSecondaryHref}>{heroSecondaryLabel}</a>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                {["Chocolate-covered strawberries", "Cake pops", "Dessert boxes", "Custom orders"].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-full border border-white/80 bg-white/75 px-4 py-3 text-sm font-medium text-foreground"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative min-h-[420px] overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,244,247,0.96),rgba(255,255,255,0.84))] shadow-card sm:col-span-2">
              {homepage.hero_image_url ? (
                <Image
                  src={homepage.hero_image_url}
                  alt={homepage.hero_image_alt ?? "Luxury custom desserts by L&A Amor & Sugar"}
                  fill
                  priority
                  className="hidden object-cover sm:block"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : null}
              {homepage.hero_mobile_image_url ? (
                <Image
                  src={homepage.hero_mobile_image_url}
                  alt={
                    homepage.hero_mobile_image_alt ??
                    homepage.hero_image_alt ??
                    "Luxury custom desserts by L&A Amor & Sugar"
                  }
                  fill
                  priority
                  className="object-cover sm:hidden"
                  sizes="100vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 max-w-sm rounded-[1.5rem] bg-white/88 p-5 shadow-card backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bakery-gold">
                  Custom desserts
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-foreground">
                  Styled beautifully for gifting, events, and celebrations.
                </h2>
              </div>
            </div>
            <Card className="border-white/70 bg-white/85">
              <CardContent className="p-6">
                <CalendarDays className="h-6 w-6 text-bakery-rose" />
                <h2 className="mt-5 font-serif text-3xl text-foreground">
                  Reserve your date early
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Custom orders are best placed 2 to 3 days ahead, and event treats may need a little extra lead time.
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/85">
              <CardContent className="p-6">
                <Truck className="h-6 w-6 text-bakery-gold" />
                <h2 className="mt-5 font-serif text-3xl text-foreground">
                  Pickup or local delivery
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Choose the option that works best for your celebration and let us handle the sweet details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {homepage.content_json.sections_order.map((sectionKey) => (
        <div key={sectionKey}>{sectionNodes[sectionKey] ?? null}</div>
      ))}
    </div>
  );
}
