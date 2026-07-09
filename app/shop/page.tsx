import { Suspense } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CakeSlice } from "lucide-react";

import { CustomDesignCta } from "@/components/site/custom-design-cta";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {categories
        .map((category: CategoryRow) => ({
          category,
          count: products.filter((product) => product.categories?.id === category.id).length
        }))
        .filter((item: { category: CategoryRow; count: number }) => item.count > 0)
        .map(({ category, count }: { category: CategoryRow; count: number }) => {
        return (
          <Link
            key={category.id}
            href={(category.slug ? `/collections/${category.slug.toLowerCase()}` : "/shop") as Route}
            className="group block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bakery-rose focus-visible:ring-offset-4"
          >
            <article className="h-full rounded-[1.25rem] bg-white p-3 shadow-[0_18px_50px_rgba(82,57,44,0.08)] transition duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_24px_70px_rgba(82,57,44,0.14)]">
              <div className="relative aspect-square overflow-hidden rounded-[1.125rem] bg-[#F9F6F2]">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition duration-500 ease-out group-hover:scale-[1.025]"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-3 text-center text-bakery-cocoa">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(82,57,44,0.08)] sm:h-14 sm:w-14">
                      <CakeSlice className="h-6 w-6 text-bakery-rose sm:h-7 sm:w-7" aria-hidden="true" />
                    </span>
                    <span className="font-serif text-lg leading-tight sm:text-xl">{category.name}</span>
                  </div>
                )}
                <Badge
                  variant="outline"
                  className="absolute right-3 top-3 border-white/80 bg-white/90 text-[11px] shadow-sm backdrop-blur"
                >
                  {count}
                </Badge>
              </div>
              <div className="px-1 pb-1 pt-4">
                <h3 className="font-serif text-xl leading-tight text-foreground transition group-hover:text-bakery-rose sm:text-2xl">
                  {category.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {category.description ||
                    "Curated sweets crafted for gifting, milestones, and elegant dessert tables."}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-bakery-rose">
                  View Collection
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </article>
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
    const matchesSeasonal = params.seasonal === "true" ? product.seasonal : true;

    return matchesQuery && matchesCategory && matchesSeasonal;
  });
  const optionalFeaturedProducts = filteredProducts.filter((product) =>
    Boolean((product as typeof product & { is_featured?: unknown }).is_featured)
  );

  return (
    <div className="bg-[#F9F6F2]">
      <div className="container py-16">
        <SectionHeading
          eyebrow="Shop"
          title="Curated desserts for gifting and celebrations"
          description="Filter by category, search your favorites, and customize items directly from the product page."
          as="h1"
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
    </div>
  );
}
