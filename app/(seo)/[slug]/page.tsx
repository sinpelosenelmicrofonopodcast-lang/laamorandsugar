import { notFound } from "next/navigation";

import { SeoLandingPageView } from "@/components/site/seo-landing-page";
import { buildMetadata } from "@/lib/config/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLocalServiceJsonLd
} from "@/lib/seo";
import { getLocalSeoPage, localSeoPages } from "@/lib/seo-content";

type SeoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return localSeoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: SeoPageProps) {
  const { slug } = await params;
  const page = getLocalSeoPage(slug);

  if (!page) {
    return buildMetadata({ title: "Page Not Found", path: `/${slug}` });
  }

  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    imageAlt: page.title
  });
}

export default async function LocalSeoPage({ params }: SeoPageProps) {
  const { slug } = await params;
  const page = getLocalSeoPage(slug);

  if (!page) {
    notFound();
  }

  const schemas = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: page.title, path: `/${page.slug}` }
    ]),
    buildFaqJsonLd(page.faqs),
    buildLocalServiceJsonLd({
      name: page.title,
      description: page.metaDescription,
      path: `/${page.slug}`
    })
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <SeoLandingPageView page={page} />
    </>
  );
}
