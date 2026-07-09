import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";
import { getCategories, getProducts } from "@/lib/data/queries";
import { blogPosts, localSeoPages } from "@/lib/seo-content";
import type { CategoryRow } from "@/lib/types/app";

const staticRoutes = [
  { path: "/", priority: 1 },
  { path: "/links", priority: 0.98 },
  { path: "/menu", priority: 0.96 },
  { path: "/shop", priority: 0.92 },
  { path: "/blog", priority: 0.68 },
  { path: "/treat-designer", priority: 0.88 },
  { path: "/treat-designer/teacher-appreciation", priority: 0.74 },
  { path: "/treat-designer/graduation-gold", priority: 0.74 },
  { path: "/treat-designer/luxury-pink", priority: 0.74 },
  { path: "/treat-designer/coffee-lover-collection", priority: 0.74 },
  { path: "/treat-designer/romantic-luxe", priority: 0.74 },
  { path: "/custom-orders", priority: 0.86 },
  { path: "/about", priority: 0.7 },
  { path: "/reviews", priority: 0.68 },
  { path: "/faq", priority: 0.64 },
  { path: "/policies", priority: 0.58 },
  { path: "/contact", priority: 0.62 }
];

function url(path: string) {
  return new URL(path, siteConfig.url).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: url(route.path),
      lastModified: now,
      changeFrequency: route.path === "/" || route.path === "/menu" ? "daily" as const : "weekly" as const,
      priority: route.priority
    })),
    ...products.map((product) => ({
      url: url(`/products/${product.slug}`),
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: product.featured ? 0.9 : product.seasonal ? 0.86 : 0.78
    })),
    ...categories.map((category: CategoryRow) => ({
      url: url(`/collections/${category.slug.toLowerCase()}`),
      lastModified: category.updated_at ? new Date(category.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.72
    })),
    ...localSeoPages.map((page) => ({
      url: url(`/${page.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82
    })),
    ...blogPosts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.62
    }))
  ];
}
