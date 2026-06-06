import { siteConfig } from "@/lib/config/site";
import { getProducts } from "@/lib/data/queries";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const products = await getProducts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products
  .map((product) => {
    const loc = new URL(`/products/${product.slug}`, siteConfig.url).toString();
    const lastmod = product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString();
    const priority = product.featured ? "0.90" : product.seasonal ? "0.86" : "0.78";

    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
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
