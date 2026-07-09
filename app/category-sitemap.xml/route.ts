import { siteConfig } from "@/lib/config/site";
import { getCategories, getProducts } from "@/lib/data/queries";
import type { CategoryRow } from "@/lib/types/app";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories
  .filter((category: CategoryRow) => products.some((product) => product.categories?.id === category.id))
  .map((category: CategoryRow) => {
    const loc = new URL(`/collections/${category.slug.toLowerCase()}`, siteConfig.url).toString();
    const lastmod = category.updated_at ? new Date(category.updated_at).toISOString() : new Date().toISOString();

    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.72</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
