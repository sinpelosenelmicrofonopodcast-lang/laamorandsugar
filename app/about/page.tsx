import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "About",
  description: "Learn about L&A Amor & Sugar Co. and the family story behind the brand.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <div className="container py-16">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionHeading
          eyebrow="Our Story"
          title="A premium bakery brand built around family, beauty, and celebration"
          description="L&A Amor & Sugar Co. was designed to feel warm, polished, and unforgettable. Every dessert is made with love by mom & her girls, with presentation that feels elevated enough for gifting and events."
        />
        <Card className="overflow-hidden">
          <CardContent className="grid min-h-[420px] content-end bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.78)),url('/products/about-atelier.svg')] bg-cover bg-center p-8">
            <div className="max-w-md rounded-[1.75rem] bg-white/86 p-6 backdrop-blur">
              <p className="text-sm leading-7 text-muted-foreground">
                The brand direction blends pastel softness, golden detail, and boutique bakery presentation so every box feels special before it is even opened.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          "Made for intimate celebrations and thoughtful gifting",
          "Designed with a soft luxury visual language",
          "Powered by a real admin workflow for orders, specials, and fulfillment"
        ].map((item) => (
          <Card key={item}>
            <CardContent className="p-6">
              <p className="font-medium text-foreground">{item}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
