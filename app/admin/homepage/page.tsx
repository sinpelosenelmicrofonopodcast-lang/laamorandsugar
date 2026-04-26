import { HomepageForm } from "@/components/admin/homepage-form";
import {
  getAllProductsAdmin,
  getHomepageContent,
  getMediaAssets,
  getSeasonalSpecials,
  getTestimonials
} from "@/lib/data/queries";

export default async function AdminHomepagePage() {
  const [homepage, products, testimonials, specials, assets] = await Promise.all([
    getHomepageContent(),
    getAllProductsAdmin(),
    getTestimonials(),
    getSeasonalSpecials(),
    getMediaAssets()
  ]);

  return (
    <HomepageForm
      homepage={homepage}
      products={products}
      testimonials={testimonials}
      specials={specials}
      assets={assets}
    />
  );
}
