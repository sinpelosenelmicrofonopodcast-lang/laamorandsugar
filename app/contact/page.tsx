import { Mail, MapPin, MessageCircleHeart, Phone } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import { getWhatsAppHref } from "@/lib/whatsapp";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch with L&A Amor & Sugar Co. for questions, pickup, delivery, and custom requests.",
  path: "/contact"
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappHref = getWhatsAppHref(settings.support_phone);

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Contact"
        title="Let’s plan your next sweet moment"
        description="Use the custom order form for event requests, or contact us directly for order questions and general support."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Phone,
            title: "Phone",
            value: settings.support_phone ?? "Not configured",
            href: settings.support_phone ? `tel:${settings.support_phone.replace(/[^\d+]/g, "")}` : null
          },
          {
            icon: MessageCircleHeart,
            title: "WhatsApp Business",
            value: "Chat with us directly",
            href: whatsappHref
          },
          {
            icon: Mail,
            title: "Email",
            value: settings.support_email ?? "Not configured",
            href: settings.support_email ? `mailto:${settings.support_email}` : null
          },
          {
            icon: MapPin,
            title: "Location",
            value: settings.address ?? "Killeen, TX",
            href: null
          }
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-6">
              <item.icon className="h-5 w-5 text-bakery-gold" />
              <h2 className="mt-4 font-serif text-3xl">{item.title}</h2>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-3 inline-flex text-sm font-semibold leading-6 text-bakery-rose transition hover:text-bakery-gold"
                >
                  {item.value}
                </a>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
