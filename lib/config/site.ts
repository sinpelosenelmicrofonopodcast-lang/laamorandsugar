import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/utils";

export const siteConfig = {
  name: "L&A Amor & Sugar Co.",
  shortName: "L&A Amor & Sugar",
  defaultMetaTitle: "Luxury Chocolate Covered Strawberries in Killeen TX | L&A Amor & Sugar",
  defaultTwitterTitle: "Luxury Dessert Gifts in Killeen TX | L&A Amor & Sugar",
  description:
    "Order luxury chocolate covered strawberries, custom desserts, cake pops, treat boxes, edible arrangements, and dessert delivery in Killeen TX, Fort Hood, and Central Texas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://amorandsugarla.com",
  ogImage: absoluteUrl("/og-image.jpg"),
  links: {
    instagram: "https://www.instagram.com/amorandsugarla",
    facebook: "https://www.facebook.com/amorandsugarla",
    tiktok: "https://www.tiktok.com/@amorsugarla"
  },
  contact: {
    email: "info@amorandsugarla.com",
    phone: "+19383365234"
  }
} as const;

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  imageAlt,
  twitterTitle,
  noIndex = false
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  twitterTitle?: string;
  noIndex?: boolean;
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
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false
          }
        }
      : undefined
  };
}
