import { Suspense } from "react";
import type { Route } from "next";
import Link from "next/link";

import { CustomDesignCta } from "@/components/site/custom-design-cta";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategories, getProducts } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import type { CategoryRow } from "@/lib/types/app";

export const metadata = buildMetadata({
  title: "Shop Luxury Desserts in Killeen TX",
  description:
    "Shop chocolate covered strawberries, cake pops, dessert boxes, and gift-ready treats made fresh in Killeen, TX for pickup and local delivery.",
  path: "/shop"
});

const categoryPriority = [
  "thanksgiving", "autumn", "strawberr", "cake pop", "cakesicle", "oreo",
  "cookie", "brownie", "pretzel", "gift", "box", "birthday", "themed",
  "party", "custom", "seasonal"
];

function sortCategories<T extends CategoryRow>(categories: T[]): T[] {
  const rank = (category: T) => {
    const text = `${category.slug} ${category.name}`.toLowerCase();
    const index = categoryPriority.findIndex((term) => text.includes(term));
    return index < 0 ? categoryPriority.length : index;
  };
  return [...categories].sort(
    (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)
  );
}

type ShopPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    seasonal?: string;
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
    <form className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-card md:grid-cols-[minmax(0,1fr)_220px_160px]">
      <input
        name="q"
        defaultValue={currentQuery}
        placeholder="Search treats, flavors, themes..."
        className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm"
      />
      <select
        name="category"
        defaultValue={currentCategory ?? ""}
        className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm"
      >
        <option value="">All collections</option>
        {sortCategories(categories).map((category: CategoryRow) => (
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
  const availableCategories = sortCategories(categories)
    .map((category: CategoryRow) => ({
      category,
      count: products.filter((product) => product.categories?.id === category.id).length
    }))
    .filter(({ count }) => count > 0);

  return (
    <nav aria-label="Browse dessert collections" className="flex flex-wrap gap-2.5">
      {availableCategories.map(({ category, count }) => (
        <Link
          key={category.id}
          href={("/shop?category=" + encodeURIComponent(category.slug)) as Route}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-bakery-rose/15 bg-white px-4 py-2.5 text-sm font-medium text-bakery-espresso shadow-sm transition hover:border-bakery-rose/50 hover:bg-bakery-blush/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bakery-rose"
        >
          <span className="truncate">{category.name}</span>
          <span className="rounded-full bg-bakery-blush/40 px-2 py-0.5 text-xs text-bakery-espresso/70">{count}</span>
        </Link>
      ))}
    </nav>
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
    const matchesSeasonal = params.seasonal === "true" ? product.seasonal : true;

    return matchesQuery && matchesCategory && matchesSeasonal;
  });
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const featuredA = a.featured ? 1 : 0;
    const featuredB = b.featured ? 1 : 0;
    return featuredB - featuredA || a.name.localeCompare(b.name);
  });
  const hasFilters = Boolean(params.q?.trim() || params.category || params.seasonal === "true");

  return (
    <div className="bg-[#F9F6F2]">
      <div className="container py-16">
        <SectionHeading
          eyebrow="Shop"
          title="Curated desserts for gifting and celebrations"
          description="Filter by category, search your favorites, and customize items directly from the product page."
          as="h1"
        />
        <div className="mt-8">
          <Suspense>
            <SearchForm
              categories={categories}
              currentQuery={params.q}
              currentCategory={params.category}
            />
          </Suspense>
        </div>
        {!hasFilters ? (
          <section aria-label="Shop by collection" className="mt-8">
            <h2 className="mb-4 font-serif text-xl text-bakery-espresso sm:text-2xl">Find your favorite treats</h2>
            <CategoryShowcase categories={categories} products={products} />
          </section>
        ) : null}
        <section aria-label="Product catalog" className="mt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bakery-rose">Browse treats</p>
              <h2 className="mt-2 font-serif text-3xl text-bakery-espresso">
                {params.category
                  ? categories.find((category) => category.slug === params.category)?.name ?? "Selected collection"
                  : hasFilters ? "Search results" : "All treats"}
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </span>
          </div>
          {hasFilters ? (
            <Link href="/shop" className="mb-6 inline-flex text-sm font-semibold text-bakery-rose underline underline-offset-4">
              Clear filters and view all products
            </Link>
          ) : null}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No products matched those filters"
              description="Try a broader search or clear the category filter to explore the full collection."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
        <div className="mt-16"><HowItWorksSection /></div>
        <CustomDesignCta />
      </div>
    </div>
  );
}
