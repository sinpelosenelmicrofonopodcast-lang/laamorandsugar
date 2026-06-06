import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { blogPosts } from "@/lib/seo-content";

export const metadata = buildMetadata({
  title: "Dessert Gift Ideas Blog | Killeen TX Luxury Treats",
  description:
    "Luxury dessert gift ideas, chocolate covered strawberry guides, teacher appreciation treats, graduation desserts, and custom cake pop inspiration in Killeen TX.",
  path: "/blog"
});

export default function BlogIndexPage() {
  const schema = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container py-16">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]} />
        <SectionHeading
          eyebrow="Sweet ideas"
          title="Luxury dessert gift guides for Killeen and Central Texas"
          description="Helpful ideas for birthdays, graduations, teacher appreciation, Fort Hood gifts, edible arrangements, custom treats, and premium dessert gifting."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <Card key={post.slug} className="border-white/70 bg-white/85 shadow-card">
              <CardContent className="flex h-full flex-col gap-5 p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                    {post.category} • {post.readTime}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight text-foreground">
                    {post.title}
                  </h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{post.excerpt}</p>
                </div>
                <Button asChild variant="outline" className="mt-auto w-fit rounded-full">
                  <Link href={`/blog/${post.slug}` as Route}>
                    Read guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
