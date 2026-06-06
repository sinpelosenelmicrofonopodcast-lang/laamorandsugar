import { NextResponse } from "next/server";

import { siteConfig } from "@/lib/config/site";

export function GET() {
  const email = siteConfig.contact.email;
  const body = [
    `Contact: mailto:${email}`,
    `Preferred-Languages: en, es`,
    `Canonical: ${siteConfig.url}/.well-known/security.txt`,
    `Policy: ${siteConfig.url}/policies`,
    "Hiring: https://amorandsugarla.com/contact",
    ""
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
}
