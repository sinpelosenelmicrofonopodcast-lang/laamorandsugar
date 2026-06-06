import { MenuExperience } from "@/components/site/menu-experience";
import { buildMetadata } from "@/lib/config/site";
import {
  getHomepageContent,
  getMediaAssets,
  getProducts,
  getSiteSettings,
  getTestimonials
} from "@/lib/data/queries";
import { buildBreadcrumbJsonLd, buildMenuJsonLd } from "@/lib/seo";
import type { HomepageImageAsset } from "@/lib/types/app";

export const metadata = buildMetadata({
  title: "Luxury Sweet Gifts Menu",
  description:
    "Explore chocolate covered strawberries in Killeen TX, custom cake pops, dessert boxes, edible arrangements, teacher gifts, graduation treats, and luxury dessert gifts.",
  path: "/menu"
});

function mapMediaAssetsToGallery(
  assets: {
    id: string;
    public_url: string | null;
    file_name: string;
  }[]
): HomepageImageAsset[] {
  return assets
    .filter((asset) => asset.public_url)
    .slice(0, 9)
    .map((asset) => ({
      image_url: asset.public_url as string,
      alt_text: asset.file_name,
      title: null,
      caption: null,
      description: null,
      asset_id: asset.id
    }));
}

export default async function MenuPage() {
  const [homepage, products, testimonials, mediaAssets, settings] = await Promise.all([
    getHomepageContent(),
    getProducts(),
    getTestimonials(),
    getMediaAssets(),
    getSiteSettings()
  ]);
  const galleryImages =
    homepage.content_json.gallery.images.length > 0
      ? homepage.content_json.gallery.images
      : mapMediaAssetsToGallery(mediaAssets);
  const jsonLd = [buildBreadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }]), buildMenuJsonLd(products)];

  return (
    <>
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <MenuExperience
        products={products}
        galleryImages={galleryImages}
        testimonials={testimonials}
        treatDesignerEnabled={settings.feature_settings.treat_designer_enabled}
      />
    </>
  );
}
