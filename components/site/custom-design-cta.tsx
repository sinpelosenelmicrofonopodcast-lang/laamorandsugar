import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CustomDesignCta() {
  return (
    <section className="py-16">
      <Card className="overflow-hidden border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,217,221,0.52),rgba(197,155,69,0.09))] shadow-card">
        <CardContent className="grid gap-6 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              Custom Design
            </p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
              Need a custom design?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Share your inspiration, colors, quantity, and occasion so we can create something that feels personal, polished, and gift-worthy.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Birthdays and milestone moments",
              "Baby showers and reveals",
              "Client gifts and thank-you boxes",
              "Seasonal dessert tables"
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-white/70 bg-white/80 px-5 py-4 text-sm font-medium text-foreground shadow-sm"
              >
                <div className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-bakery-gold" />
                  {item}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Button asChild variant="gold" size="lg">
              <Link href="/custom-orders">
                Custom Order
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
