import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/utils";

export const siteConfig = {
  name: "L&A Amor & Sugar Co.",
  shortName: "L&A Amor & Sugar",
  defaultMetaTitle: "L&A Amor & Sugar | Custom Desserts in Killeen, TX",
  defaultTwitterTitle: "L&A Amor & Sugar | Custom Desserts",
  description:
    "Chocolate strawberries, cake pops, dessert boxes, and custom treats made with love. Order online today.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: absoluteUrl("/og-image.jpg"),
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
  path = "",
  image,
  imageAlt,
  twitterTitle
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  twitterTitle?: string;
} = {}): Metadata {
  const fullTitle = title
    ? title.includes(siteConfig.shortName) || title.includes(siteConfig.name)
      ? title
      : `${title} | ${siteConfig.shortName}`
    : siteConfig.defaultMetaTitle;
  const fullDescription = description ?? siteConfig.description;
  const url = absoluteUrl(path);
  const fullImage = image ?? siteConfig.ogImage;
  const ogImageAlt = imageAlt ?? siteConfig.shortName;
  const fullTwitterTitle =
    twitterTitle ?? (title ? fullTitle : siteConfig.defaultTwitterTitle);

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
          url: fullImage,
          alt: ogImageAlt
        }
      ],
      locale: "en_US",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: fullTwitterTitle,
      description: fullDescription,
      images: [fullImage]
    },
    alternates: {
      canonical: url
    }
  };
}
