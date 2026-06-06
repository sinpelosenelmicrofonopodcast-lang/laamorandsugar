import { siteConfig } from "@/lib/config/site";
import { getHomepageContent, getMediaAssets, getProducts } from "@/lib/data/queries";
import { getProductPrimaryImage } from "@/lib/product-presentation";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [products, homepage, mediaAssets] = await Promise.all([
    getProducts(),
    getHomepageContent(),
    getMediaAssets()
  ]);
  const homeImages = [
    homepage.hero_image_url,
    homepage.hero_mobile_image_url,
    ...homepage.content_json.gallery.images.map((image) => image.image_url),
    ...mediaAssets.map((asset) => asset.public_url)
  ].filter((image): image is string => typeof image === "string" && image.trim().length > 0);
  const entries = [
    {
      loc: new URL("/", siteConfig.url).toString(),
      images: homeImages.slice(0, 24).map((image) => ({
        loc: image,
        title: "L&A Amor & Sugar luxury dessert gifts"
      }))
    },
    ...products
      .map((product) => {
        const primary = getProductPrimaryImage(product);
        const images = [
          primary,
          ...product.product_images.map((image) => image.image_url)
        ].filter((image): image is string => typeof image === "string" && image.trim().length > 0);

        return {
          loc: new URL(`/products/${product.slug}`, siteConfig.url).toString(),
          images: images
            .filter((image, index, allImages) => allImages.indexOf(image) === index)
            .slice(0, 8)
            .map((image) => ({
              loc: image,
              title: product.name
            }))
        };
      })
      .filter((entry) => entry.images.length > 0)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map((entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
${entry.images
  .map((image) => `    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`)
  .join("\n")}
  </url>`)
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
