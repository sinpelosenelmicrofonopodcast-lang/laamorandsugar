import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarHeart, Gift, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";
import { getProducts } from "@/lib/data/queries";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo";
import { getOccasionHref, occasionLinks } from "@/lib/storefront-taxonomy";

const occasionFaqs = [
  {
    question: "Can occasion treats be customized?",
    answer:
      "Yes. Most orders can include custom colors, themes, names, edible images, logos, packaging details, and notes depending on timing and availability."
  },
  {
    question: "How early should I order for an event?",
    answer:
      "Two to three days notice is recommended for small orders. Larger events, corporate gifts, and detailed themes should be requested earlier."
  },
  {
    question: "Do you offer pickup and local delivery?",
    answer:
      "Pickup and local delivery may be available in Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Temple, Belton, and nearby Central Texas areas."
  }
];

export const metadata = buildMetadata({
  title: "Shop Desserts by Occasion in Killeen TX",
  description:
    "Shop luxury dessert gifts by occasion for birthdays, baby showers, weddings, graduations, military promotions, holidays, and Central Texas events.",
  path: "/occasions"
});

export default async function OccasionsPage() {
  const products = await getProducts();
  const featuredProducts = products.filter((product) => product.featured || product.seasonal).slice(0, 4);
  const schemas = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Occasions", path: "/occasions" }
    ]),
    buildFaqJsonLd(occasionFaqs)
  ];

  return (
    <main className="container py-16 sm:py-20">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <section className="overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,244,247,0.88),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10">
        <Badge variant="gold">Shop by occasion</Badge>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
          Luxury dessert gifts for every sweet moment
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Browse occasion-ready sweets for Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Temple,
          Belton, and Central Texas celebrations. Choose a collection, then personalize details inside the
          product or custom order experience.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
            <Link href="/shop">Shop Products</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/custom-orders">Build Your Own Treats</Link>
          </Button>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <SectionHeading
          eyebrow="Occasions"
          title="Find the right treat faster"
          description="Each occasion page groups relevant sweets without duplicating products or creating confusing add-on collections."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {occasionLinks.map((occasion) => (
            <Link key={occasion.slug} href={getOccasionHref(occasion.slug) as Route} className="group">
              <Card className="h-full border-white/70 bg-white/85 shadow-card transition duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <CalendarHeart className="h-5 w-5 text-bakery-gold" />
                    <ArrowRight className="h-4 w-4 text-bakery-rose transition group-hover:translate-x-1" />
                  </div>
                  <h2 className="mt-5 font-serif text-3xl leading-tight text-foreground">
                    {occasion.label}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {occasion.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 ? (
        <section className="py-14 sm:py-16">
          <SectionHeading
            eyebrow="Best sellers"
            title="Popular gifts for celebrations"
            description="Start with customer favorites, then add colors, notes, logos, edible images, or custom details where available."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} ctaLabel="View gift details" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 pb-4 md:grid-cols-3">
        {[
          ["Custom themes", Sparkles],
          ["Gift-ready packaging", Gift],
          ["Event date planning", CalendarHeart]
        ].map(([label, Icon]) => {
          const TrustIcon = Icon as typeof Sparkles;

          return (
            <div key={label as string} className="rounded-[1.5rem] border border-white/75 bg-white/84 p-6 shadow-sm">
              <TrustIcon className="h-5 w-5 text-bakery-gold" />
              <p className="mt-4 font-serif text-2xl text-foreground">{label as string}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
