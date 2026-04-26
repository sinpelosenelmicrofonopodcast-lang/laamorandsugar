import { AboutPageForm } from "@/components/admin/about-page-form";
import { getAboutPageContent } from "@/lib/data/queries";

export default async function AdminAboutPage() {
  const content = await getAboutPageContent();

  return <AboutPageForm content={content} />;
}
