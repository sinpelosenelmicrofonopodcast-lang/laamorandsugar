import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SeasonalSpecialRow, TestimonialRow } from "@/lib/types/app";
import {
  getActiveSeasonalSpecials,
  getHomepageContent,
  getProducts,
  getTestimonials
} from "@/lib/data/queries";

export default async function HomePage() {
  const [homepage, featuredProducts, testimonials, specials] = await Promise.all([
    getHomepageContent(),
    getProducts({ featuredOnly: true }),
    getTestimonials(),
    getActiveSeasonalSpecials()
  ]);
  const heroPrimaryLabel = homepage.hero_primary_cta_label ?? "Shop treats";
  const heroPrimaryHref = homepage.hero_primary_cta_href ?? "/shop";
  const heroSecondaryLabel = homepage.hero_secondary_cta_label ?? "Custom Order";
  const heroSecondaryHref = homepage.hero_secondary_cta_href ?? "/custom-orders";

  return (
    <div className="pb-24">
      <section className="container grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="fancy-border relative overflow-hidden rounded-[2.75rem] border border-white/60 bg-white/72 p-8 shadow-[0_28px_80px_rgba(120,85,63,0.14)] backdrop-blur sm:p-12">
          <div className="absolute inset-0 rounded-[inherit] bg-gold-ribbon opacity-60" />
          <div className="absolute inset-x-10 top-0 h-40 rounded-full bg-[radial-gradient(circle,rgba(197,155,69,0.24),transparent_68%)] blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(248,217,221,0.6),transparent_66%)] blur-3xl" />
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
              <Badge variant="gold">{homepage.hero_eyebrow ?? "Luxury Dessert Studio"}</Badge>
              <span className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-espresso/80">
                Made for gifting, showers, and celebrations
              </span>
            </div>
            <h1 className="max-w-3xl font-serif text-5xl leading-none tracking-tight text-foreground sm:text-6xl">
              {homepage.hero_title ?? "Premium sweets for moments worth remembering"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              {homepage.hero_description ??
                "Boutique dessert boxes, strawberries, and custom treats styled to feel polished, thoughtful, and gift-ready."}
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href={heroPrimaryHref}>{heroPrimaryLabel}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={heroSecondaryHref}>{heroSecondaryLabel}</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Gift, label: "Premium dessert boxes" },
                { icon: Truck, label: "Pickup + local delivery" },
                { icon: Sparkles, label: "Custom event styling" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.75rem] border border-white/70 bg-white/82 px-4 py-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-white"
                >
                  <item.icon className="h-5 w-5 text-bakery-gold" />
                  <p className="mt-3 text-sm font-medium text-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden sm:col-span-2">
            <CardContent className="grid min-h-[320px] place-items-end bg-[linear-gradient(145deg,rgba(255,244,247,0.95),rgba(255,255,255,0.85)),url('/products/hero-bakery.svg')] bg-cover bg-center p-8">
              <div className="ml-auto max-w-sm rounded-[1.75rem] bg-white/86 p-6 shadow-card backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bakery-gold">
                  Celebration Ready
                </p>
                <h2 className="mt-3 font-serif text-4xl text-foreground">
                  Luxe presentation for birthdays, showers, and gifting.
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CalendarDays className="h-6 w-6 text-bakery-rose" />
              <h3 className="mt-5 font-serif text-3xl">Reserve your date early</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Custom orders are reviewed by event date, design complexity, and finishing details.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <ShieldCheck className="h-6 w-6 text-bakery-gold" />
              <h3 className="mt-5 font-serif text-3xl">Thoughtful order handling</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Pickup and delivery options, order notes, date selection, and status tracking are built in.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {specials.length > 0 ? (
        <section className="container pb-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {specials.map((special: SeasonalSpecialRow) => (
              <Card key={special.id} className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,217,221,0.58))]">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-8">
                  <div>
                    <Badge variant="rose">Seasonal special</Badge>
                    <h2 className="mt-4 font-serif text-4xl">{special.title}</h2>
                    {special.subtitle ? (
                      <p className="mt-3 text-lg text-bakery-rose">{special.subtitle}</p>
                    ) : null}
                    {special.description ? (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {special.description}
                      </p>
                    ) : null}
                  </div>
                  {special.cta_label && special.cta_href ? (
                    <Button asChild variant="gold">
                      <a href={special.cta_href}>
                        {special.cta_label}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container py-16">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Featured"
            title={homepage.featured_heading ?? "Featured products"}
            description={homepage.featured_description ?? undefined}
          />
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link href="/shop">Shop all</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <SectionHeading
            eyebrow="Process"
            title={homepage.process_heading ?? "How it works"}
            description={homepage.process_description ?? undefined}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your treats",
                description: "Shop ready-to-order boxes or begin a custom request with your event details."
              },
              {
                step: "02",
                title: "Confirm pickup or delivery",
                description: "Select your preferred date, add notes, and complete checkout securely with Stripe."
              },
              {
                step: "03",
                title: "We style every detail",
                description: "Your order moves from pending to ready with updates managed from the bakery dashboard."
              }
            ].map((item) => (
              <Card key={item.step}>
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                    {item.step}
                  </p>
                  <h3 className="mt-4 font-serif text-3xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow="Testimonials"
          title={homepage.testimonials_heading ?? "Loved by our clients"}
          description={homepage.testimonials_description ?? undefined}
          align="center"
          className="mx-auto max-w-3xl"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.slice(0, 3).map((testimonial: TestimonialRow) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </section>

      <section className="container py-16">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(197,155,69,0.09),rgba(248,217,221,0.6))]">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <SectionHeading
              eyebrow="Custom Events"
              title={homepage.cta_heading ?? "Need something custom?"}
              description={homepage.cta_description ?? undefined}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Birthdays and intimate dinners",
                "Baby showers and gender reveals",
                "Bridal events and client gifting",
                "Seasonal menus and holiday bundles"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-white/70 bg-white/80 px-5 py-4 text-sm font-medium text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <Button asChild variant="gold" size="lg">
                <Link href="/custom-orders">Start a custom order</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
