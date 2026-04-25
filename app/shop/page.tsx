import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CustomDesignCta } from "@/components/site/custom-design-cta";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategories, getProducts } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import type { CategoryRow } from "@/lib/types/app";

export const metadata = buildMetadata({
  title: "Shop",
  description: "Browse signature dessert boxes, berries, cupcakes, and seasonal bakery treats.",
  path: "/shop"
});

type ShopPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

function SearchForm({
  categories,
  currentQuery,
  currentCategory
}: {
  categories: Awaited<ReturnType<typeof getCategories>>;
  currentQuery?: string;
  currentCategory?: string;
}) {
  return (
    <form className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-card md:grid-cols-[1fr_220px_160px]">
      <input
        name="q"
        defaultValue={currentQuery}
        placeholder="Search berries, cupcake boxes, bundles..."
        className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm"
      />
      <select
        name="category"
        defaultValue={currentCategory ?? ""}
        className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((category: CategoryRow) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-12 rounded-full bg-bakery-rose px-5 text-sm font-semibold text-white"
      >
        Apply filters
      </button>
    </form>
  );
}

function CategoryShowcase({
  categories,
  products
}: {
  categories: Awaited<ReturnType<typeof getCategories>>;
  products: Awaited<ReturnType<typeof getProducts>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category: CategoryRow) => {
        const count = products.filter((product) => product.categories?.id === category.id).length;

        return (
          <Link
            key={category.id}
            href={category.slug ? `/shop?category=${category.slug}` : "/shop"}
            className="group"
          >
            <Card className="fancy-border overflow-hidden border-white/70 bg-white/84 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(120,85,63,0.13)]">
              <CardContent className="relative p-6">
                <div className="absolute inset-x-6 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(248,217,221,0.45),transparent_68%)] blur-2xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                      Category
                    </p>
                    <h3 className="mt-3 font-serif text-3xl text-foreground transition group-hover:text-bakery-rose">
                      {category.name}
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-white/80">
                    {count} items
                  </Badge>
                </div>
                {category.description ? (
                  <p className="relative mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>
                ) : (
                  <p className="relative mt-4 text-sm leading-6 text-muted-foreground">
                    Explore curated sweets crafted for gifting, milestones, and sweet tables.
                  </p>
                )}
                <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bakery-rose">
                  Browse category
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const query = params.q?.toLowerCase().trim();
  const filteredProducts = products.filter((product) => {
    const matchesQuery = query
      ? [
          product.name,
          product.short_description ?? "",
          product.description ?? "",
          product.categories?.name ?? ""
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      : true;
    const matchesCategory = params.category
      ? product.categories?.slug === params.category
      : true;

    return matchesQuery && matchesCategory;
  });
  const optionalFeaturedProducts = filteredProducts.filter((product) =>
    Boolean((product as typeof product & { is_featured?: unknown }).is_featured)
  );

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Shop"
        title="Curated desserts for gifting and celebrations"
        description="Filter by category, search your favorites, and customize items directly from the product page."
      />
      <div className="mt-10">
        <CategoryShowcase categories={categories} products={products} />
      </div>
      <div className="mt-8">
        <Suspense>
          <SearchForm
            categories={categories}
            currentQuery={params.q}
            currentCategory={params.category}
          />
        </Suspense>
      </div>
      {optionalFeaturedProducts.length > 0 ? (
        <section className="py-16">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Featured Picks"
              title="Most-loved treats right now"
              description="A curated set of products marked for extra attention in the catalog."
            />
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/custom-orders">Custom Order</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {optionalFeaturedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
      <HowItWorksSection />
      <div className="mt-10">
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No products matched those filters"
            description="Try a broader search or clear the category filter to explore the full collection."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <CustomDesignCta />
    </div>
  );
}
