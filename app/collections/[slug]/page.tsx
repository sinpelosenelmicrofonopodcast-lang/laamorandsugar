import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/config/site";
import { getCategories, getProducts } from "@/lib/data/queries";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo";
import type { CategoryRow } from "@/lib/types/app";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

const collectionFaqs = [
  {
    question: "Can I order this collection for pickup or local delivery?",
    answer:
      "Yes. Pickup and local delivery options may be available in Killeen and nearby Central Texas areas depending on order date and availability."
  },
  {
    question: "Can collection treats be customized?",
    answer:
      "Many items can be personalized with colors, themes, notes, packaging details, or custom requests from the product page or custom order form."
  },
  {
    question: "How early should I order?",
    answer:
      "Two to three days notice is recommended for handcrafted dessert gifts, especially for weekends, holidays, graduations, and teacher appreciation orders."
  }
];

function getCollectionDescription(category: CategoryRow | undefined) {
  return (
    category?.description ??
    `Shop ${category?.name ?? "luxury dessert gifts"} from L&A Amor & Sugar in Killeen TX, including custom treats, gift-ready dessert boxes, chocolate covered strawberries, cake pops, Oreos, and edible gifts.`
  );
}

function getCollectionMetaDescription(category: CategoryRow | undefined) {
  const fallback = `Shop ${category?.name ?? "luxury dessert gifts"} in Killeen, TX with made-fresh treats for pickup, local delivery, gifts, and celebrations.`;
  const description = category?.description?.trim() || fallback;

  return description.length > 155 ? `${description.slice(0, 152).trimEnd()}...` : description;
}

export async function generateMetadata({ params }: CollectionPageProps) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item: CategoryRow) => item.slug.toLowerCase() === slug.toLowerCase());

  if (!category) {
    return buildMetadata({
      title: "Luxury Dessert Collection",
      description: "Shop luxury dessert gifts, custom treats, and sweet boxes in Killeen TX.",
    path: `/collections/${slug}`
    });
  }

  const cleanSlug = category.slug.toLowerCase();

  return buildMetadata({
    title: `${category.name} in Killeen TX`,
    description: getCollectionMetaDescription(category),
    path: `/collections/${cleanSlug}`
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const category = categories.find((item: CategoryRow) => item.slug.toLowerCase() === slug.toLowerCase());

  if (!category) {
    notFound();
  }

  const cleanSlug = category.slug.toLowerCase();
  const collectionProducts = products.filter((product) => product.categories?.slug.toLowerCase() === category.slug.toLowerCase());
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Collections", path: "/shop" },
      { name: category.name, path: `/collections/${cleanSlug}` }
    ]),
    buildFaqJsonLd(collectionFaqs),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${new URL(`/collections/${cleanSlug}`, process.env.NEXT_PUBLIC_SITE_URL ?? "https://amorandsugarla.com").toString()}#collection`,
      name: `${category.name} in Killeen TX`,
      description: getCollectionDescription(category)
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category.name} products`,
      itemListElement: collectionProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: new URL(`/products/${product.slug}`, process.env.NEXT_PUBLIC_SITE_URL ?? "https://amorandsugarla.com").toString()
      }))
    }
  ];

  return (
    <main className="container py-12 sm:py-16">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Collections", href: "/shop" },
          { name: category.name, href: `/collections/${cleanSlug}` }
        ]}
      />

      <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,244,247,0.86),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant="gold">Luxury dessert collection</Badge>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
              {category.name} in Killeen, TX
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {getCollectionDescription(category)}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild variant="gold" size="lg" className="shadow-glow">
              <Link href="/shop">
                Order Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/custom-orders">Reserve Your Date</Link>
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["Secure checkout", ShieldCheck],
            ["Local pickup and delivery", Truck],
            ["Handcrafted gift-ready treats", Sparkles]
          ].map(([label, Icon]) => {
            const TrustIcon = Icon as typeof ShieldCheck;

            return (
              <div key={label as string} className="flex items-center gap-3 rounded-full border border-white/80 bg-white/78 px-4 py-3 text-sm font-semibold text-bakery-espresso">
                <TrustIcon className="h-4 w-4 text-bakery-gold" />
                {label as string}
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <SectionHeading
          eyebrow={`${collectionProducts.length} sweet options`}
          title="Gift-ready picks from this collection"
          description="Choose a product, add it to cart, or start a custom order for colors, themes, packaging, and personal details."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} ctaLabel="View gift details" />
          ))}
        </div>
        {collectionProducts.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-white/75 bg-white/84 p-8 text-center shadow-card">
            <p className="font-serif text-3xl text-foreground">This collection is being refreshed.</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Browse the full menu or request a custom dessert gift while new items are added.
            </p>
            <Button asChild variant="gold" className="mt-6">
              <Link href="/menu">View Menu</Link>
            </Button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3">
        {collectionFaqs.map((faq) => (
          <article key={faq.question} className="rounded-[1.6rem] border border-white/75 bg-white/84 p-6 shadow-sm">
            <h2 className="font-serif text-2xl leading-tight text-foreground">{faq.question}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
