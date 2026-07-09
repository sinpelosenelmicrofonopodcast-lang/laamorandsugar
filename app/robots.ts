import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/login",
          "/account",
          "/auth",
          "/api",
          "/checkout",
          "/cart",
          "/_next/",
          "/*?*",
          "/*.json$",
          "/reset-password",
          "/forgot-password",
          "/order-status",
          "/order-status/"
        ]
      }
    ],
    sitemap: [
      new URL("/sitemap.xml", siteConfig.url).toString(),
      new URL("/product-sitemap.xml", siteConfig.url).toString(),
      new URL("/image-sitemap.xml", siteConfig.url).toString(),
      new URL("/category-sitemap.xml", siteConfig.url).toString(),
      new URL("/merchant-feed.xml", siteConfig.url).toString()
    ],
    host: siteConfig.url
  };
}
