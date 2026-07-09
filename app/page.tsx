import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Coffee,
  Gift,
  GraduationCap,
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
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/constants";
import { buildFaqJsonLd } from "@/lib/seo";
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
  getSiteSettings,
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
      title: null,
      caption: null,
      description: null,
      asset_id: asset.id
    }));
}

const occasionCards = [
  { title: "Birthday Favorites", href: "/shop?q=birthday", icon: Gift },
  { title: "Romantic Gifts", href: "/shop?q=romantic", icon: Heart },
  { title: "Teacher Appreciation", href: "/shop?q=teacher", icon: Star },
  { title: "Coffee Lover Collection", href: "/shop?q=coffee", icon: Coffee },
  { title: "Luxury Event Treats", href: "/custom-orders?occasion=events", icon: Sparkles },
  { title: "Viral Favorites", href: "/shop?q=viral", icon: ShoppingBag },
  { title: "Girls Night Collection", href: "/shop?q=girls%20night", icon: Package },
  { title: "Graduation Collection", href: "/shop?q=graduation", icon: GraduationCap },
  { title: "Office Gifts", href: "/shop?q=office", icon: Truck },
  { title: "Just Because", href: "/shop?q=just%20because", icon: Heart }
];

const giftBoxSteps = [
  "Select your treats",
  "Pick colors and theme",
  "Add logo, note, or custom details",
  "Choose pickup or local delivery"
];

const homeFaqs = [
  {
    question: "Do you make chocolate covered strawberries in Killeen TX?",
    answer:
      "Yes. L&A Amor & Sugar makes gift-ready chocolate covered strawberries, dessert boxes, cake pops, Oreos, and custom treats for Killeen and nearby Central Texas customers."
  },
  {
    question: "Do you offer local dessert delivery?",
    answer:
      "Local delivery may be available in Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Belton, Temple, and nearby areas depending on order date, distance, and availability."
  },
  {
    question: "Can I customize a dessert gift?",
    answer:
      "Yes. You can request colors, themes, drizzle, sprinkles, packaging, notes, logos, and personal details through custom orders or the Treat Designer."
  },
  {
    question: "How much notice do custom desserts need?",
    answer:
      "Two to three days notice is recommended for handcrafted dessert gifts, especially around weekends, holidays, graduations, and teacher appreciation week."
  }
];

const premiumTrustSignals = [
  "Military family owned",
  "Puerto Rican owned",
  "Made fresh to order",
  "Premium chocolate",
  "Pickup in Killeen",
  "Delivery available"
];

function BrandedGalleryPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/4.5] overflow-hidden rounded-[1.5rem] bg-[linear-gradient(145deg,rgba(255,250,246,0.98),rgba(248,217,221,0.72))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,155,69,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(216,109,146,0.18),transparent_42%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <Camera className="h-8 w-8 text-bakery-gold" />
        <p className="mt-4 font-serif text-2xl leading-tight text-bakery-espresso">
          {label}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-bakery-rose">
          Photo coming soon
        </p>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const homepage = await getHomepageContent();
  const homeContent = homepage.content_json.home_content;

  return buildMetadata({
    title: "Luxury Chocolate Covered Treats in Killeen TX",
    description:
      "Made-fresh chocolate covered strawberries, cake pops, dessert boxes, and custom treats for pickup and local delivery in Killeen, TX.",
    path: "/",
    image: homepage.hero_image_url ?? homepage.hero_mobile_image_url ?? undefined,
    imageAlt: homepage.hero_image_alt ?? homeContent.hero.headline
  });
}

export default async function HomePage() {
  const [homepage, allProducts, testimonials, specials, mediaAssets, settings] = await Promise.all([
    getHomepageContent(),
    getProducts(),
    getTestimonials(),
    getActiveSeasonalSpecials(),
    getMediaAssets(),
    getSiteSettings()
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
  const homeContent = {
    ...homepage.content_json.home_content,
    hero: {
      ...homepage.content_json.home_content.hero,
      headline: "Luxury Chocolate Covered Treats in Killeen, Texas",
      subheadline:
        "Made fresh for birthdays, weddings, baby showers, graduations, corporate gifts, anniversaries, holidays, and custom orders across Killeen and Central Texas.",
      cta_primary: "Shop Best Sellers",
      cta_secondary: "Custom Order",
      chips: premiumTrustSignals
    }
  };
  const aboutLines = homeContent.about
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const aboutTitle = aboutLines[0] ?? homeContent.about;
  const aboutDescription = aboutLines.slice(1).join("\n\n") || homeContent.about;
  const testimonialsHeading =
    homepage.testimonials_heading ?? DEFAULT_HOMEPAGE_CONTENT.testimonials_heading;

  const heroPrimaryHref = homepage.hero_primary_cta_href ?? "/shop";
  const heroPrimaryLabel = homeContent.hero.cta_primary;
  const heroSecondaryHref = homepage.hero_secondary_cta_href ?? "/custom-orders";
  const heroSecondaryLabel = homeContent.hero.cta_secondary;
  const productCtaLabel = homeContent.hero.cta_primary;
  const urgencyItems = [
    "Limited handcrafted availability this week",
    "Orders require 2-3 days notice",
    "Same-day availability may be limited",
    "Local delivery in Killeen, TX"
  ];

  const occasionSection = (
    <section className="container py-16 sm:py-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Perfect For"
          title="Shop by the moment you want to create"
          description="Birthday treats, teacher gifts, office gifts, romantic surprises, graduation boxes, and custom desserts for Killeen, TX celebrations."
        />
        <Button asChild variant="outline" className="md:mb-1">
          <Link href="/shop">Explore all gifts</Link>
        </Button>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {occasionCards.map((occasion) => {
          const Icon = occasion.icon;

          return (
            <a key={occasion.title} href={occasion.href} className="group">
              <div className="h-full rounded-[1.5rem] border border-white/75 bg-white/82 p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_60px_rgba(120,85,63,0.13)]">
                <div className="flex items-center justify-between gap-4">
                  <Icon className="h-5 w-5 text-bakery-gold" />
                  <ArrowRight className="h-4 w-4 text-bakery-rose transition group-hover:translate-x-1" />
                </div>
                <h3 className="mt-5 font-serif text-2xl leading-tight text-foreground">
                  {occasion.title}
                </h3>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );

  const giftBoxSection = (
    <section className="container py-16 sm:py-20">
      <div className="overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,247,0.84),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge variant="gold">Personalized sweet gifts</Badge>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              Build Your Gift Box
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Pick your treats, colors, theme, packaging, and personal details. We’ll turn your idea into a gift-ready sweet experience.
            </p>
            <Button asChild variant="gold" size="lg" className="mt-8 shadow-glow">
              <Link href="/custom-orders">Start Custom Order</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {giftBoxSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-[1.5rem] border border-white/80 bg-white/82 p-5 shadow-sm transition duration-300 hover:-translate-y-1"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.26em] text-bakery-gold">
                  Step {index + 1}
                </span>
                <p className="mt-3 font-serif text-2xl leading-tight text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const treatDesignerPromo = (
    <section className="container py-16 sm:py-20">
      <div className="grid gap-8 rounded-[2.5rem] border border-white/75 bg-white/84 p-7 shadow-card sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge variant="rose">Premium personalization tool</Badge>
          <h2 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            Design Your Own Treat
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Choose your treat, colors, drizzle, sprinkles, edible logo, and packaging details.
          </p>
        </div>
        <Button asChild variant="gold" size="lg" className="shadow-glow">
          <Link href="/treat-designer">Open Treat Designer</Link>
        </Button>
      </div>
    </section>
  );

  const sectionNodes: Partial<Record<HomepageSectionKey, React.ReactNode>> = {
    featured:
      homepage.content_json.featured.is_enabled && featuredProducts.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              title={homeContent.best_sellers.title}
              description={homeContent.best_sellers.subtitle}
            />
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/shop">{heroPrimaryLabel}</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} ctaLabel={productCtaLabel} />
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
              <div className="absolute inset-0 bg-gradient-to-t from-bakery-espresso/20 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 rounded-full bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold backdrop-blur">
                {homeContent.custom_order.title}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <SectionHeading
                eyebrow="Build your gift box"
                title="Pick every detail. We’ll make it gift-ready."
                description="Pick your treats, colors, theme, packaging, and personal details. We’ll turn your idea into a gift-ready sweet experience."
              />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                How it comes together
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {giftBoxSteps.map((bullet, index) => (
                  <div
                    key={bullet}
                    className="rounded-[1.35rem] border border-border/70 bg-white/85 px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {index + 1}. {bullet}
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
                    <Badge variant="rose">
                      {selectedSpecials[0].subtitle ?? homepage.content_json.seasonal.title}
                    </Badge>
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
                <ProductCard key={product.id} product={product} ctaLabel={productCtaLabel} />
              ))}
            </div>
          </div>
        </section>
      ) : null,
    trust: homepage.content_json.trust.is_enabled ? (
      <section className="container py-16 sm:py-20">
        <SectionHeading
          title={aboutTitle}
          description={aboutDescription}
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
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {card.text}
                  </p>
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
            title={testimonialsHeading}
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
      homepage.content_json.gallery.is_enabled ? (
        <section className="container py-16 sm:py-20">
          <SectionHeading
            eyebrow="Real Sweet Moments"
            title={homepage.content_json.gallery.title}
            description="A polished look at recent creations, customer photos, and gift-ready custom desserts as the gallery grows."
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galleryImages.length > 0
              ? galleryImages.slice(0, 12).map((image, index) => (
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
                ))
              : ["Custom dessert boxes", "Chocolate-covered strawberries", "Edible arrangements", "Event sweets"].map(
                  (label) => <BrandedGalleryPlaceholder key={label} label={label} />
                )}
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
                title={homeContent.final_cta.title}
                description={homeContent.final_cta.text}
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
                  <Link href="/shop">{heroPrimaryLabel}</Link>
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
  const homeFaqSection = (
    <section className="container py-16 sm:py-20">
      <SectionHeading
        eyebrow="Dessert gifting FAQ"
        title="Sweet details before you order"
        description="Helpful answers for Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Temple, Belton, and Central Texas customers planning chocolate covered strawberries, custom desserts, cake pops, treat boxes, and edible gifts."
        align="center"
        className="mx-auto max-w-3xl"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {homeFaqs.map((faq) => (
          <article key={faq.question} className="rounded-[1.6rem] border border-white/75 bg-white/84 p-6 shadow-sm">
            <h2 className="font-serif text-2xl leading-tight text-foreground">{faq.question}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(homeFaqs)) }}
      />
      <div className="pb-24">
      <section className="container py-14 sm:py-18 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
          <div className="fancy-border relative overflow-hidden rounded-[2.75rem] border border-white/60 bg-white/80 p-8 shadow-[0_28px_80px_rgba(120,85,63,0.14)] backdrop-blur sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,155,69,0.17),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(248,217,221,0.55),transparent_38%)]" />
              {homepage.hero_background_image_url ? (
                <Image
                  src={homepage.hero_background_image_url}
                  alt={homepage.hero_background_image_alt ?? "Homepage background"}
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
                  {homeContent.hero.eyebrow}
                </Badge>
                <span className="rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-espresso/80">
                  {homeContent.hero.badge}
                </span>
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-none tracking-tight text-foreground sm:text-6xl">
                {homeContent.hero.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {homeContent.hero.subheadline}
              </p>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-bakery-rose">
                {homeContent.hero.urgency}
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="gold" size="lg">
                  <a href={heroPrimaryHref}>{heroPrimaryLabel}</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={heroSecondaryHref}>{heroSecondaryLabel}</a>
                </Button>
              </div>
              <p className="mt-6 max-w-2xl text-base italic leading-7 text-foreground/80">
                {homeContent.hero.micro_copy}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                {homeContent.hero.chips.map(
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
              <div className="mt-8 grid gap-3 text-sm font-semibold text-bakery-espresso sm:grid-cols-2">
                <Link href="/reviews" className="rounded-2xl border border-bakery-gold/20 bg-bakery-gold/10 px-4 py-3 transition hover:bg-bakery-gold/15">
                  Customer reviews
                </Link>
                <Link href="/faq" className="rounded-2xl border border-bakery-gold/20 bg-bakery-gold/10 px-4 py-3 transition hover:bg-bakery-gold/15">
                  Freshness, pickup, and delivery FAQ
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative min-h-[420px] overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,244,247,0.96),rgba(255,255,255,0.84))] shadow-card sm:col-span-2">
              {homepage.hero_image_url ? (
                <Image
                  src={homepage.hero_image_url}
                  alt={homepage.hero_image_alt ?? homeContent.hero.image_title}
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
                    homeContent.hero.image_title
                  }
                  fill
                  priority
                  className="object-cover sm:hidden"
                  sizes="100vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-bakery-espresso/24 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 max-w-sm rounded-[1.5rem] bg-white/88 p-5 shadow-card backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bakery-gold">
                  {homeContent.hero.image_badge}
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-foreground">
                  {homeContent.hero.image_title}
                </h2>
              </div>
            </div>
            <Card className="border-white/70 bg-white/85">
              <CardContent className="p-6">
                <CalendarDays className="h-6 w-6 text-bakery-rose" />
                <h2 className="mt-5 font-serif text-3xl text-foreground">
                  {homeContent.hero.reserve_card_title}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {homeContent.hero.reserve_card_text}
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/85">
              <CardContent className="p-6">
                <Truck className="h-6 w-6 text-bakery-gold" />
                <h2 className="mt-5 font-serif text-3xl text-foreground">
                  {homeContent.hero.delivery_card_title}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {homeContent.hero.delivery_card_text}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container pb-6">
        <div className="grid gap-3 rounded-[1.75rem] border border-bakery-gold/20 bg-white/82 p-4 shadow-card backdrop-blur md:grid-cols-4">
          {urgencyItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,244,247,0.72))] px-4 py-3 text-sm font-semibold text-bakery-espresso"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-bakery-gold" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {homepage.content_json.sections_order.map((sectionKey) => (
        <Fragment key={sectionKey}>
          {sectionNodes[sectionKey] ?? null}
          {sectionKey === "featured" ? occasionSection : null}
          {sectionKey === "custom_orders" && !homepage.content_json.custom_orders.is_enabled
            ? giftBoxSection
            : null}
          {sectionKey === "seasonal" && settings.feature_settings.treat_designer_enabled
            ? treatDesignerPromo
            : null}
          {sectionKey === "testimonials" ? homeFaqSection : null}
        </Fragment>
      ))}
      </div>
    </>
  );
}
