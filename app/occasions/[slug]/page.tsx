import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Truck } from "lucide-react";

import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo";
import { matchesProductIntent } from "@/lib/product-presentation";
import { getOccasionHref, occasionLinks } from "@/lib/storefront-taxonomy";

type OccasionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return occasionLinks.map((occasion) => ({ slug: occasion.slug }));
}

function getOccasion(slug: string) {
  return occasionLinks.find((occasion) => occasion.slug === slug);
}

function getSearchTerms(label: string, slug: string) {
  return [label, slug.replace(/-/g, " "), label.replace(/'s/g, ""), slug.split("-")[0]];
}

export async function generateMetadata({ params }: OccasionPageProps) {
  const { slug } = await params;
  const occasion = getOccasion(slug);

  if (!occasion) {
    return buildMetadata({
      title: "Dessert Occasion",
      path: `/occasions/${slug}`
    });
  }

  return buildMetadata({
    title: `${occasion.label} Desserts in Killeen TX`,
    description: `${occasion.description} Order luxury dessert gifts from L&A Amor & Sugar for Killeen, Fort Cavazos, Harker Heights, Copperas Cove, and Central Texas.`,
    path: getOccasionHref(occasion.slug)
  });
}

export default async function OccasionDetailPage({ params }: OccasionPageProps) {
  const { slug } = await params;
  const occasion = getOccasion(slug);

  if (!occasion) {
    notFound();
  }

  const products = await getProducts();
  const terms = getSearchTerms(occasion.label, occasion.slug);
  const matchedProducts = products
    .filter((product) => terms.some((term) => matchesProductIntent(product, term)))
    .slice(0, 12);
  const visibleProducts = matchedProducts.length > 0 ? matchedProducts : products.filter((product) => product.featured).slice(0, 8);
  const faqs = [
    {
      question: `Can I customize ${occasion.label.toLowerCase()} desserts?`,
      answer:
        "Yes. Share colors, names, themes, logos, edible images, packaging preferences, event date, and notes through product options or the custom order form."
    },
    {
      question: "Is local delivery available?",
      answer:
        "Pickup and local delivery may be available in Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Temple, Belton, and nearby Central Texas areas."
    }
  ];
  const schemas = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Occasions", path: "/occasions" },
      { name: occasion.label, path: getOccasionHref(occasion.slug) }
    ]),
    buildFaqJsonLd(faqs)
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
      <section className="overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,244,247,0.86),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10">
        <Badge variant="gold">{occasion.label}</Badge>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
          {occasion.label} dessert gifts in Killeen, TX
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          {occasion.description} Made fresh for local pickup and delivery when available across Killeen,
          Fort Cavazos, Harker Heights, Copperas Cove, Belton, Temple, and Central Texas.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
            <Link href="/custom-orders">
              Start Custom Order
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/shop">Shop All Products</Link>
          </Button>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <SectionHeading
          eyebrow={`${visibleProducts.length} recommended picks`}
          title={`Shop ${occasion.label.toLowerCase()} sweets`}
          description="Products stay centralized and may appear across multiple occasions without duplicate listings."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} ctaLabel="Personalize this gift" />
          ))}
        </div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-2">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-[1.6rem] border border-white/75 bg-white/84 p-6 shadow-sm">
            <Sparkles className="h-5 w-5 text-bakery-gold" />
            <h2 className="mt-4 font-serif text-2xl leading-tight text-foreground">{faq.question}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
          </article>
        ))}
        <article className="rounded-[1.6rem] border border-white/75 bg-white/84 p-6 shadow-sm">
          <Truck className="h-5 w-5 text-bakery-gold" />
          <h2 className="mt-4 font-serif text-2xl leading-tight text-foreground">Need bulk or corporate gifting?</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use the custom order form for logo uploads, edible images, bulk quantities, and event-specific notes.
          </p>
        </article>
      </section>
    </main>
  );
}
