import { siteConfig } from "@/lib/config/site";
import { getProducts } from "@/lib/data/queries";
import {
  getProductDescription,
  getProductPrimaryImage,
  getProductStartingPrice
} from "@/lib/product-presentation";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanMerchantText(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s&.,'’()+-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const products = await getProducts();
  const now = new Date().toUTCString();
  const items = products.map((product) => {
    const price = `${getProductStartingPrice(product).toFixed(2)} USD`;
    const link = new URL(`/products/${product.slug}`, siteConfig.url).toString();
    const image = getProductPrimaryImage(product) ?? new URL("/products/placeholder-elegance.svg", siteConfig.url).toString();
    const description = getProductDescription(product);
    const availability = product.stock_quantity === 0 ? "out_of_stock" : "in_stock";

    return `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(cleanMerchantText(product.name))}</g:title>
      <g:description>${escapeXml(cleanMerchantText(description))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${escapeXml(price)}</g:price>
      <g:brand>${escapeXml(siteConfig.shortName)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>Food, Beverages &amp; Tobacco &gt; Food Items &gt; Bakery</g:google_product_category>
      <g:product_type>${escapeXml(cleanMerchantText(product.categories?.name ?? "Luxury dessert gifts"))}</g:product_type>
      <g:pickup_method>buy</g:pickup_method>
      <g:pickup_sla>multi-day</g:pickup_sla>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(siteConfig.shortName)} Product Feed</title>
    <link>${escapeXml(siteConfig.url)}</link>
    <description>Luxury dessert gifts, chocolate covered strawberries, cake pops, Oreos, treat boxes, and custom sweets in Killeen TX.</description>
    <lastBuildDate>${escapeXml(now)}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
