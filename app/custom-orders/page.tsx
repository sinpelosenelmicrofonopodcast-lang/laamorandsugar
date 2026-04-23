import { CustomOrderForm } from "@/components/site/custom-order-form";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Custom Orders",
  description: "Request luxury custom dessert orders for birthdays, showers, gifting, and seasonal events.",
  path: "/custom-orders"
});

export default function CustomOrdersPage() {
  return (
    <div className="container py-16">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Bespoke Treats"
            title="Custom sweets designed around your event"
            description="Share your inspiration, date, quantity, budget, and colors. Upload a reference image and we will follow up with a personalized quote."
          />
          <div className="grid gap-4">
            {[
              {
                title: "Design-first requests",
                description: "Ideal for baby showers, birthdays, client gifting, and special presentation moments."
              },
              {
                title: "Clear timelines",
                description: "Your request is reviewed by event date so we can confirm production and fulfillment capacity."
              },
              {
                title: "One organized intake flow",
                description: "Reference uploads, notes, quantity, event theme, and budget all live in one admin queue."
              }
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <h3 className="font-serif text-3xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <CustomOrderForm />
      </div>
    </div>
  );
}
