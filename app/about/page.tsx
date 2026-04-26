import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";
import { getAboutPageContent } from "@/lib/data/queries";

export const metadata = buildMetadata({
  title: "About L&A Amor & Sugar | Custom Desserts in Killeen, TX",
  description:
    "Learn the story behind L&A Amor & Sugar, a custom dessert brand creating cake pops, chocolate-covered strawberries, dessert boxes, and gift-ready treats in Killeen, TX.",
  path: "/about"
});

export default async function AboutPage() {
  const content = await getAboutPageContent();

  return (
    <div className="container py-16">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            {content.hero_eyebrow}
          </p>
          <div className="space-y-5">
            <h1 className="font-serif text-5xl leading-tight text-foreground sm:text-6xl">
              {content.hero_title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              {content.hero_text}
            </p>
          </div>
          <Button asChild variant="gold" size="lg">
            <Link href={(content.cta_button_link ?? "/custom-orders") as Route}>
              {content.cta_button_text}
            </Link>
          </Button>
        </div>
        <Card className="overflow-hidden border-white/70 bg-white/70 shadow-card">
          <CardContent className="p-0">
            {content.hero_image_url ? (
              <div className="relative min-h-[420px]">
                <Image
                  src={content.hero_image_url}
                  alt={content.hero_image_alt ?? "L&A Amor & Sugar desserts"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-bakery-blush/25" />
              </div>
            ) : (
              <div className="flex min-h-[420px] items-end bg-[radial-gradient(circle_at_top_left,rgba(255,214,224,0.9),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,244,248,0.88))] p-8">
                <div className="max-w-sm rounded-[1.75rem] bg-white/90 p-6 shadow-card backdrop-blur">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Beautiful treats, romantic presentation, and thoughtful details for every sweet moment.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/70 bg-white/70 shadow-card">
          <CardContent className="space-y-4 p-8">
            <h2 className="font-serif text-3xl text-foreground">{content.section_one_title}</h2>
            <p className="leading-8 text-muted-foreground">{content.section_one_text}</p>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-bakery-blush/25 shadow-card">
          <CardContent className="space-y-4 p-8">
            <h2 className="font-serif text-3xl text-foreground">{content.section_two_title}</h2>
            <p className="leading-8 text-muted-foreground">{content.section_two_text}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-14">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {content.highlight_cards.map((card) => (
            <Card
              key={card.title}
              className="border-white/70 bg-white/80 shadow-card transition-transform hover:-translate-y-1"
            >
              <CardContent className="space-y-3 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-bakery-gold">
                  Highlight
                </p>
                <h3 className="font-serif text-2xl text-foreground">{card.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{card.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {content.gallery_images.length > 0 ? (
        <section className="mt-14">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              Sweet gallery
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {content.gallery_images.slice(0, 6).map((image, index) => (
              <Card key={`${image.image_url}-${index}`} className="overflow-hidden border-white/70 bg-white/80 shadow-card">
                <CardContent className="p-0">
                  <div className="relative aspect-[1.02]">
                    <Image
                      src={image.image_url}
                      alt={image.alt_text}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-white/70 bg-white/75 shadow-card">
          <CardContent className="space-y-4 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              Signature look
            </p>
            <h2 className="font-serif text-3xl text-foreground">{content.style_title}</h2>
            <p className="leading-8 text-muted-foreground">{content.style_text}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-white/70 bg-[linear-gradient(145deg,rgba(255,248,250,0.98),rgba(255,233,239,0.92))] shadow-card">
          <CardContent className="space-y-5 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              Let’s create something beautiful
            </p>
            <h2 className="font-serif text-4xl text-foreground">{content.cta_title}</h2>
            <p className="max-w-xl leading-8 text-muted-foreground">{content.cta_text}</p>
            <Button asChild variant="gold" size="lg">
              <Link href={(content.cta_button_link ?? "/custom-orders") as Route}>
                {content.cta_button_text}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
