import { HomepageForm } from "@/components/admin/homepage-form";
import { getHomepageContent } from "@/lib/data/queries";

export default async function AdminHomepagePage() {
  const homepage = await getHomepageContent();

  return <HomepageForm homepage={homepage} />;
}
