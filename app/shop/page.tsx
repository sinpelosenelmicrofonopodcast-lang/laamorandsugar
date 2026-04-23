import { Suspense } from "react";

import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
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

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Shop"
        title="Curated desserts for gifting and celebrations"
        description="Filter by category, search your favorites, and customize items directly from the product page."
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
    </div>
  );
}
