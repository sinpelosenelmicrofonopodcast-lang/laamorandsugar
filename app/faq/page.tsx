import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";

const faqs = [
  {
    question: "How far in advance should I place an order?",
    answer:
      "Ready-to-order products can often be placed with shorter notice, but custom orders should be submitted as early as possible so the date can be reviewed and confirmed."
  },
  {
    question: "Do you offer local delivery?",
    answer:
      "Yes. Delivery or pickup is selected during checkout, and delivery fees can be configured from the admin settings panel."
  },
  {
    question: "Can I request a custom color palette or event theme?",
    answer:
      "Absolutely. The custom order form includes fields for colors, event type, budget, inspiration image upload, quantity, and notes."
  },
  {
    question: "Do you offer seasonal specials?",
    answer:
      "Yes. Seasonal banners and specials can be scheduled by date and published automatically on the homepage."
  }
];

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Common questions about ordering, custom requests, pickup, and delivery.",
  path: "/faq"
});

export default function FaqPage() {
  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="FAQ"
        title="Everything guests usually ask before they order"
        description="Clear fulfillment expectations help the checkout experience feel smooth and polished."
      />
      <div className="mt-10 grid gap-4">
        {faqs.map((faq) => (
          <Card key={faq.question}>
            <CardContent className="p-6">
              <h2 className="font-serif text-3xl text-foreground">{faq.question}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
