import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd
} from "@/lib/seo";
import { blogPosts, getBlogPost } from "@/lib/seo-content";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return buildMetadata({ title: "Blog Post Not Found", path: `/blog/${slug}` });
  }

  return buildMetadata({
    title: post.metaTitle,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
    imageAlt: post.title
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const schemas = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` }
    ]),
    buildBlogPostingJsonLd({
      title: post.title,
      description: post.metaDescription,
      path: `/blog/${post.slug}`,
      publishedAt: post.publishedAt
    }),
    buildFaqJsonLd(post.faqs)
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
      <article className="container max-w-4xl py-16">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Blog", href: "/blog" },
            { name: post.title, href: `/blog/${post.slug}` }
          ]}
        />
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          {post.category} • {post.readTime}
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-foreground sm:text-6xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>

        <div className="mt-10 space-y-6">
          {post.sections.map((section) => (
            <Card key={section.title} className="border-white/70 bg-white/85 shadow-card">
              <CardContent className="space-y-4 p-7">
                <h2 className="font-serif text-3xl text-foreground">{section.title}</h2>
                <p className="leading-8 text-muted-foreground">{section.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-10 grid gap-4">
          {post.faqs.map((faq) => (
            <Card key={faq.question} className="border-bakery-gold/20 bg-bakery-gold/10">
              <CardContent className="p-6">
                <h2 className="font-serif text-2xl text-foreground">{faq.question}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="mt-12 rounded-[2rem] bg-white/85 p-7 text-center shadow-card">
          <h2 className="font-serif text-3xl text-foreground">Ready to create a sweet moment?</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 text-muted-foreground">
            Shop luxury dessert gifts or start a custom order for your next Killeen, Fort Hood,
            or Central Texas celebration.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="gold">
              <Link href="/shop">Order Now</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/custom-orders">Start Custom Order</Link>
            </Button>
          </div>
        </div>
      </article>
    </>
  );
}
