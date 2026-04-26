import { SectionHeading } from "@/components/site/section-heading";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/config/site";

const faqs = [
  {
    question: "How far in advance should I place my order?",
    answer:
      "We recommend placing custom orders at least 2–3 days in advance. Larger orders, seasonal specials, or detailed designs may require more time depending on availability."
  },
  {
    question: "Do you offer local delivery?",
    answer:
      "Yes, local delivery is available in select areas. Delivery options and fees may vary depending on your location and order size."
  },
  {
    question: "Can I pick up my order?",
    answer:
      "Yes, pickup is available. Pickup details will be confirmed after your order is reviewed."
  },
  {
    question: "Can I request custom colors, themes, or designs?",
    answer:
      "Absolutely. We specialize in custom treats for birthdays, baby showers, holidays, gifts, events, and special occasions."
  },
  {
    question: "Do you make treats for holidays or seasonal events?",
    answer:
      "Yes. Seasonal boxes and limited-time treats are available during holidays such as Valentine’s Day, Mother’s Day, Easter, Christmas, and more."
  },
  {
    question: "Can I send inspiration pictures?",
    answer:
      "Yes. Inspiration photos are welcome and help us understand the look, colors, and style you want."
  },
  {
    question: "Are your treats made fresh?",
    answer:
      "Yes. Every order is made with care and prepared as close to the pickup or delivery date as possible."
  },
  {
    question: "Do you offer refunds or cancellations?",
    answer:
      "Because our desserts are custom-made, all sales are final once the order is confirmed. If you need to make changes, please contact us as soon as possible."
  },
  {
    question: "Do your products contain allergens?",
    answer:
      "Some treats may contain milk, eggs, wheat, soy, nuts, or other allergens. Please let us know about allergies before placing an order."
  },
  {
    question: "How do I place a custom order?",
    answer:
      "You can submit a request through the Custom Orders page or contact us directly by email or social media."
  }
];

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Common questions about ordering, custom requests, pickup, and delivery.",
  path: "/faq"
});

export default function FaqPage() {
  return (
    <div className="container py-16 sm:py-20">
      <SectionHeading
        eyebrow="FAQ"
        title="Frequently Asked Questions"
        description="Everything you need to know before placing your sweet order."
      />
      <div className="mt-10 grid gap-4 sm:gap-5">
        {faqs.map((faq) => (
          <Card
            key={faq.question}
            className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 shadow-card backdrop-blur-sm"
          >
            <CardContent className="p-6 sm:p-7">
              <h2 className="font-serif text-2xl leading-tight text-foreground sm:text-3xl">
                {faq.question}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                {faq.answer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-10 rounded-[2rem] border border-bakery-gold/20 bg-[linear-gradient(135deg,rgba(255,248,243,0.95),rgba(255,255,255,0.92))] shadow-card">
        <CardContent className="flex flex-col gap-5 p-8 text-center sm:p-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-bakery-gold">
              Custom Orders
            </p>
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
              Ready to create something sweet?
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
              Send us your idea and we&apos;ll help bring it to life.
            </p>
          </div>
          <div className="flex justify-center">
            <Button asChild variant="gold" size="lg">
              <Link href="/custom-orders">Start a Custom Order</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
