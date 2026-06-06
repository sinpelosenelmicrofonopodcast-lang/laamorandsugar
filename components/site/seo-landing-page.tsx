import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Star } from "lucide-react";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SeoLandingPage } from "@/lib/seo-content";

export function SeoLandingPageView({ page }: { page: SeoLandingPage }) {
  return (
    <div className="pb-20">
      <section className="container py-14 sm:py-20">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: page.title, href: `/${page.slug}` }
          ]}
        />
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="rounded-[2.5rem] border border-white/70 bg-white/85 p-8 shadow-card sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-tight text-foreground sm:text-6xl">
              {page.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {page.heroDescription}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href={page.primaryCtaHref as Route}>{page.primaryCtaLabel}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={page.secondaryCtaHref as Route}>{page.secondaryCtaLabel}</Link>
              </Button>
            </div>
          </div>
          <Card className="overflow-hidden border-bakery-gold/20 bg-[linear-gradient(145deg,rgba(255,250,246,0.98),rgba(255,233,239,0.88))] shadow-card">
            <CardContent className="grid h-full content-center gap-5 p-8">
              {[
                ["Local Killeen TX pickup and delivery options", MapPin],
                ["Secure checkout on our website", ShieldCheck],
                ["Handcrafted luxury dessert gifts", Star],
                ["Custom colors, notes, themes, and packaging", CheckCircle2]
              ].map(([label, Icon]) => {
                const TrustIcon = Icon as typeof MapPin;

                return (
                  <div key={label as string} className="flex items-center gap-4 rounded-[1.5rem] bg-white/80 p-4">
                    <TrustIcon className="h-5 w-5 text-bakery-gold" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">{label as string}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container grid gap-6 lg:grid-cols-2">
        {page.sections.map((section) => (
          <Card key={section.title} className="border-white/70 bg-white/80 shadow-card">
            <CardContent className="space-y-4 p-7">
              <h2 className="font-serif text-3xl text-foreground">{section.title}</h2>
              <p className="leading-8 text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container py-16">
        <div className="rounded-[2rem] border border-bakery-gold/20 bg-bakery-gold/10 p-7 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Popular searches
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {page.keywords.map((keyword) => (
              <Link
                key={keyword}
                href={`/shop?q=${encodeURIComponent(keyword)}` as Route}
                className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-bakery-espresso transition hover:-translate-y-0.5 hover:text-bakery-rose"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid gap-4 lg:grid-cols-2">
          {page.faqs.map((faq) => (
            <Card key={faq.question} className="border-white/70 bg-white/80 shadow-card">
              <CardContent className="p-6">
                <h2 className="font-serif text-2xl text-foreground">{faq.question}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pt-16">
        <div className="rounded-[2.5rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,244,248,0.9))] p-8 text-center shadow-card">
          <h2 className="font-serif text-4xl text-foreground">Ready to reserve your sweet moment?</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 text-muted-foreground">
            Limited handcrafted availability fills quickly around weekends, holidays, graduations,
            teacher appreciation week, and event seasons.
          </p>
          <Button asChild variant="gold" size="lg" className="mt-6">
            <Link href={page.primaryCtaHref as Route}>
              {page.primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
