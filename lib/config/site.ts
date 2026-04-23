import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/utils";

export const siteConfig = {
  name: "L&A Amor & Sugar Co.",
  shortName: "L&A Amor & Sugar",
  description:
    "Luxury bakery storefront and admin system for premium treats, custom orders, and celebration-ready dessert boxes.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: absoluteUrl("/brand/la-logo-official.png"),
  links: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com"
  },
  contact: {
    email: "hello@amorandsugarco.com",
    phone: "(555) 555-0147"
  }
} as const;

export function buildMetadata({
  title,
  description,
  path = ""
}: {
  title?: string;
  description?: string;
  path?: string;
} = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${siteConfig.shortName}`
    : siteConfig.name;
  const fullDescription = description ?? siteConfig.description;
  const url = absoluteUrl(path);

  return {
    title: fullTitle,
    description: fullDescription,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          alt: siteConfig.name
        }
      ],
      locale: "en_US",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [siteConfig.ogImage]
    },
    alternates: {
      canonical: url
    }
  };
}
