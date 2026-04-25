import { Gift, Palette, Truck } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Choose your treats",
    description: "Pick from dipped berries, cake pops, dessert boxes, and celebration bundles.",
    icon: Gift
  },
  {
    step: "02",
    title: "Customize your order",
    description: "Select your flavors, colors, notes, and event details so everything feels intentional.",
    icon: Palette
  },
  {
    step: "03",
    title: "We create & deliver",
    description: "We prepare, package, and coordinate pickup or delivery with boutique-level care.",
    icon: Truck
  }
] as const;

export function HowItWorksSection() {
  return (
    <section className="py-16">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <SectionHeading
          eyebrow="How It Works"
          title="A simple path from craving to celebration"
          description="Designed to feel effortless whether you are gifting, planning a party, or ordering something custom."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((item) => (
            <Card
              key={item.step}
              className="overflow-hidden border-white/70 bg-white/85 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(120,85,63,0.12)]"
            >
              <CardContent className="p-6">
                <div className="inline-flex rounded-full bg-bakery-gold/12 p-3 text-bakery-gold">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                  {item.step}
                </p>
                <h3 className="mt-3 font-serif text-3xl text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
