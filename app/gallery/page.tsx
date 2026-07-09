import Image from "next/image";
import Link from "next/link";
import { Camera, Instagram, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/config/site";
import { getHomepageContent, getMediaAssets, getTestimonials } from "@/lib/data/queries";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import type { TestimonialRow } from "@/lib/types/app";

export const metadata = buildMetadata({
  title: "Dessert Gallery",
  description:
    "View L&A Amor & Sugar dessert photos, custom treats, chocolate covered strawberries, cake pops, dessert boxes, and event sweets from Killeen, TX.",
  path: "/gallery"
});

export default async function GalleryPage() {
  const [homepage, mediaAssets, testimonials] = await Promise.all([
    getHomepageContent(),
    getMediaAssets(),
    getTestimonials()
  ]);
  const galleryImages =
    homepage.content_json.gallery.images.length > 0
      ? homepage.content_json.gallery.images
      : mediaAssets
          .filter((asset) => asset.public_url)
          .slice(0, 18)
          .map((asset) => ({
            image_url: asset.public_url as string,
            alt_text: asset.file_name,
            title: null,
            caption: null
          }));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" }
  ]);

  return (
    <main className="container py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,244,247,0.88),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10">
        <Badge variant="gold">Gallery</Badge>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
          Real sweet moments, styled with care
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Explore dessert boxes, chocolate covered strawberries, cake pops, edible images, corporate gifts,
          and custom celebration treats made for Killeen and Central Texas customers.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
            <Link href="/shop">Shop the Menu</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/custom-orders">Request a Custom Look</Link>
          </Button>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <SectionHeading
          eyebrow="Photo inspiration"
          title="Professional, gift-ready presentation"
          description="Use this gallery for inspiration, then share your preferred colors, theme, logos, edible images, names, event date, and notes in your custom request."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.length > 0 ? (
            galleryImages.map((image, index) => (
              <figure
                key={`${image.image_url}-${index}`}
                className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 shadow-card"
              >
                <div className="relative aspect-[4/4.6] overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                {(image.title || image.caption) ? (
                  <figcaption className="p-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{image.title}</span>
                    {image.caption ? <span className="block">{image.caption}</span> : null}
                  </figcaption>
                ) : null}
              </figure>
            ))
          ) : (
            ["Custom dessert boxes", "Chocolate covered strawberries", "Cake pops", "Corporate gifts", "Holiday treats", "Event sweets"].map((label) => (
              <div key={label} className="flex aspect-[4/4.6] flex-col items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/85 p-8 text-center shadow-card">
                <Camera className="h-8 w-8 text-bakery-gold" />
                <p className="mt-4 font-serif text-3xl text-foreground">{label}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 pb-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="rounded-[2rem] border border-bakery-gold/20 bg-bakery-gold/10 p-7">
          <Instagram className="h-6 w-6 text-bakery-gold" />
          <h2 className="mt-4 font-serif text-4xl text-foreground">Want this look?</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Send inspiration photos or logo files through a custom order. We will confirm what is possible,
            timing, pickup, delivery, and pricing before production.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.slice(0, 2).map((testimonial: TestimonialRow) => (
            <div key={testimonial.id} className="rounded-[1.5rem] border border-white/75 bg-white/84 p-6 shadow-sm">
              <Sparkles className="h-5 w-5 text-bakery-gold" />
              <p className="mt-4 text-sm leading-7 text-muted-foreground">“{testimonial.quote}”</p>
              <p className="mt-4 font-semibold text-foreground">{testimonial.customer_name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
