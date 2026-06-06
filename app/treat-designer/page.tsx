import { TreatDesignerLoader } from "@/components/TreatDesignerLoader";
import { TreatDesignerPaused } from "@/components/site/treat-designer-paused";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/config/site";
import { getSiteSettings, getTreatDesignerConfig } from "@/lib/data/queries";
import { buildBreadcrumbJsonLd, buildLocalServiceJsonLd } from "@/lib/seo";
import { CalendarDays, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Design Your Own Luxury Treat Experience",
  description:
    "Create a custom luxury dessert gift in Killeen TX with colors, drizzle, sprinkles, edible logo, packaging, pickup, and local delivery options.",
  path: "/treat-designer"
});

export default async function TreatDesignerPage() {
  const [config, settings] = await Promise.all([getTreatDesignerConfig(), getSiteSettings()]);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Treat Designer", path: "/treat-designer" }
    ]),
    buildLocalServiceJsonLd({
      name: "Custom Treat Designer in Killeen TX",
      description:
        "Interactive custom dessert designer for cake pops, cakesicles, Oreos, strawberries, treat boxes, edible logos, colors, packaging, pickup, and local delivery.",
      path: "/treat-designer"
    })
  ];

  return (
    <div className="pb-20">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {!settings.feature_settings.treat_designer_enabled ? (
        <TreatDesignerPaused
          message={settings.feature_settings.treat_designer_disabled_message}
        />
      ) : (
        <>
      <section className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(135deg,rgba(255,250,246,0.96),rgba(255,239,244,0.88),rgba(197,155,69,0.14))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.82),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(197,155,69,0.22),transparent_28%),radial-gradient(circle_at_74%_78%,rgba(216,109,146,0.2),transparent_36%)]" />
        <div className="pointer-events-none absolute left-[8%] top-20 hidden h-16 w-16 rounded-full border border-white/70 bg-white/45 shadow-card backdrop-blur md:block" />
        <div className="pointer-events-none absolute right-[10%] top-32 hidden h-24 w-24 rounded-full bg-bakery-blush/45 blur-sm md:block" />
        <div className="container relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_0.74fr] lg:items-center">
          <div>
            <Badge variant="gold">Luxury custom dessert builder</Badge>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-none text-foreground sm:text-7xl">
              Design Your Own Luxury Treat Experience
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create unforgettable dessert gifts customized exactly your way.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg" className="shadow-glow">
                <a href="#designer">Start Designing ✨</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/custom-orders">Request Concierge Help</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Handcrafted in Killeen", Sparkles],
                ["Pickup & local delivery", Truck],
                ["Secure custom request", ShieldCheck]
              ].map(([label, Icon]) => {
                const TrustIcon = Icon as typeof Sparkles;

                return (
                  <div key={label as string} className="flex items-center gap-3 rounded-full border border-white/75 bg-white/68 px-4 py-3 text-sm font-semibold text-bakery-espresso shadow-sm backdrop-blur">
                    <TrustIcon className="h-4 w-4 text-bakery-gold" />
                    {label as string}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative min-h-[330px] overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/62 p-5 shadow-[0_28px_90px_rgba(120,85,63,0.18)] backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_46%),linear-gradient(145deg,rgba(248,217,221,0.65),rgba(197,155,69,0.12))]" />
            <div className="relative flex h-full min-h-[290px] items-center justify-center">
              <div className="absolute left-8 top-8 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bakery-gold shadow-sm">
                Popular this week
              </div>
              <div className="relative h-56 w-56 animate-float rounded-[42%_58%_48%_52%] bg-[linear-gradient(145deg,#f7a7ba,#fff8ef)] shadow-[0_28px_70px_rgba(123,75,68,0.24)]">
                <div className="absolute left-10 top-10 h-16 w-16 rounded-full bg-white/30 blur-sm" />
                <div className="absolute left-8 top-28 h-3 w-32 rotate-[-12deg] rounded-full bg-bakery-gold/80" />
                <div className="absolute left-14 top-36 h-2 w-24 rotate-[10deg] rounded-full bg-white/85" />
                <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/86 px-4 py-2 text-sm font-bold text-bakery-espresso shadow-sm">
                  <CalendarDays className="h-4 w-4 text-bakery-rose" />
                  Limited slots
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div id="designer" className="container scroll-mt-24 py-12">
        <div className="space-y-10">
        <TreatDesignerLoader config={config} />
      </div>
    </div>
        </>
      )}
    </div>
  );
}
