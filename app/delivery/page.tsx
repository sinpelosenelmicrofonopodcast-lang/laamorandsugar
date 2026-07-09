import Link from "next/link";
import { Clock, MapPin, PackageCheck, Truck } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/config/site";
import { getSiteSettings } from "@/lib/data/queries";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo";
import { localServiceAreas } from "@/lib/storefront-taxonomy";

const deliveryFaqs = [
  {
    question: "Where do you offer pickup and delivery?",
    answer:
      "Pickup is based in Killeen, TX. Local delivery may be available for Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Temple, Belton, and nearby Central Texas areas depending on schedule and distance."
  },
  {
    question: "How much notice do orders need?",
    answer:
      "Two to three days notice is recommended for most handcrafted dessert orders. Larger orders, corporate gifts, and detailed custom designs may need more time."
  },
  {
    question: "How are treats handled after pickup or delivery?",
    answer:
      "Chocolate and custom sweets are temperature sensitive. Keep treats cool, shaded, and handled with care after pickup or delivery."
  }
];

export const metadata = buildMetadata({
  title: "Pickup and Dessert Delivery in Killeen TX",
  description:
    "Learn about L&A Amor & Sugar pickup, local dessert delivery, timing, freshness, and care for Killeen, Fort Cavazos, Harker Heights, Copperas Cove, Temple, and Belton.",
  path: "/delivery"
});

export default async function DeliveryPage() {
  const settings = await getSiteSettings();
  const schemas = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Delivery", path: "/delivery" }
    ]),
    buildFaqJsonLd(deliveryFaqs)
  ];

  return (
    <main className="container py-16 sm:py-20">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <section className="overflow-hidden rounded-[2.5rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,244,247,0.88),rgba(197,155,69,0.12))] p-7 shadow-card sm:p-10">
        <Badge variant="gold">Pickup and delivery</Badge>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
          Fresh dessert pickup and local delivery in Killeen, TX
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Every order is made fresh and packaged with care. Pickup and local delivery options are confirmed during checkout or custom order review based on timing, distance, and availability.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
            <Link href="/shop">Shop Treats</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/custom-orders">Request Event Delivery</Link>
          </Button>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <SectionHeading
          eyebrow="Service areas"
          title="Central Texas dessert fulfillment"
          description="Availability depends on order volume, production timing, weather, distance, and the details of your sweets."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {localServiceAreas.map((area) => (
            <div key={area} className="rounded-[1.5rem] border border-white/75 bg-white/84 p-6 shadow-sm">
              <MapPin className="h-5 w-5 text-bakery-gold" />
              <h2 className="mt-4 font-serif text-3xl text-foreground">{area}</h2>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3">
        {[
          {
            icon: Clock,
            title: "Processing time",
            text: "Most custom sweets need 2-3 days notice. Peak holidays and event weekends may book earlier."
          },
          {
            icon: PackageCheck,
            title: "Freshness and care",
            text: "Treats are made fresh, packaged carefully, and should be kept cool after pickup or delivery."
          },
          {
            icon: Truck,
            title: "Delivery details",
            text: settings.pickup_instructions ?? "Pickup and delivery details are shared after your order is reviewed."
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="rounded-[1.6rem] border border-white/75 bg-white/84 p-6 shadow-sm">
              <Icon className="h-5 w-5 text-bakery-gold" />
              <h2 className="mt-4 font-serif text-2xl leading-tight text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
