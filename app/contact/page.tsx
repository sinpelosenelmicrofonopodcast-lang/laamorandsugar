import { Mail, MapPin, Phone } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch with L&A Amor & Sugar Co. for questions, pickup, delivery, and custom requests.",
  path: "/contact"
});

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Contact"
        title="Let’s plan your next sweet moment"
        description="Use the custom order form for event requests, or contact the bakery directly for fulfillment questions and general support."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Phone,
            title: "Phone",
            value: settings.support_phone ?? "Not configured"
          },
          {
            icon: Mail,
            title: "Email",
            value: settings.support_email ?? "Not configured"
          },
          {
            icon: MapPin,
            title: "Location",
            value: settings.address ?? "Set your bakery address in admin settings"
          }
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-6">
              <item.icon className="h-5 w-5 text-bakery-gold" />
              <h2 className="mt-4 font-serif text-3xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
