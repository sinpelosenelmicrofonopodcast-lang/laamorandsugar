import { LinksLandingPage } from "@/components/site/links-landing-page";
import { buildMetadata } from "@/lib/config/site";
import { getSiteSettings } from "@/lib/data/queries";
import { buildLocalServiceJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Custom Desserts in Killeen | L&A Amor and Sugar",
  description:
    "Order custom desserts in Killeen TX from L&A Amor and Sugar. Shop chocolate covered strawberries, Oreos, cake pops, treat boxes, local delivery, and custom treats.",
  path: "/links",
  image: absoluteUrl("/brand/og-cover.svg"),
  imageAlt: "L&A Amor and Sugar custom desserts in Killeen TX"
});

export default async function LinksPage() {
  const settings = await getSiteSettings();
  const schema = buildLocalServiceJsonLd({
    name: "Custom Desserts in Killeen TX",
    description:
      "Luxury custom desserts, chocolate covered strawberries, cake pops, Oreos, treat boxes, edible gifts, pickup, and local delivery in Killeen Texas.",
    path: "/links"
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <LinksLandingPage settings={settings} />
    </>
  );
}
