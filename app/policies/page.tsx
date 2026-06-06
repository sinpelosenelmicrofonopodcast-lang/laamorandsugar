import { FileText, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/config/site";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const policySections = [
  {
    title: "Order Policy",
    intro:
      "By placing an order with L&A Amor & Sugar, customers agree to the following terms and conditions.",
    groups: [
      {
        heading: "Orders",
        items: [
          "All orders are custom-made and handcrafted.",
          "We highly recommend placing orders in advance to guarantee availability.",
          "Last-minute orders are subject to availability and may include rush fees."
        ]
      },
      {
        heading: "Payments",
        items: [
          "A deposit or full payment is required to secure your order.",
          "No order will begin until payment has been confirmed.",
          "We accept approved payment methods through our official platforms."
        ]
      },
      {
        heading: "Cancellations & Refunds",
        items: [
          "Due to the customized and perishable nature of our products, refunds are not available once production has started.",
          "Cancellations must be made at least 72 hours before the scheduled pickup or delivery date.",
          "Deposits for custom orders involving logos, edible images, or specialty designs are non-refundable."
        ]
      },
      {
        heading: "Pickup & Delivery",
        items: [
          "Customers are responsible for picking up orders on time.",
          "Once products leave our possession, L&A Amor & Sugar is not responsible for damage caused by heat, transportation, mishandling, or improper storage.",
          "Delivery services may be available in select areas for an additional fee."
        ]
      },
      {
        heading: "Custom Designs",
        items: [
          "Colors, decorations, and details may vary slightly due to the handmade nature of our products.",
          "We reserve the right to refuse any design request considered offensive, discriminatory, inappropriate, or illegal."
        ]
      }
    ]
  },
  {
    title: "Allergen Policy",
    intro:
      "Our products may contain or come into contact with milk, eggs, wheat, peanuts, tree nuts, and soy. While we follow proper sanitation and food handling practices, our kitchen handles multiple allergens and cannot guarantee a completely allergen-free environment.",
    groups: [
      {
        heading: "Customer Responsibility",
        items: [
          "It is the customer's responsibility to inform us of any allergies before placing an order."
        ]
      }
    ]
  },
  {
    title: "Custom Cakes & Treats Policy",
    groups: [
      {
        heading: "Inspiration vs Exact Replicas",
        items: [
          "We may use inspiration photos as references; however, exact replicas cannot be guaranteed."
        ]
      },
      {
        heading: "Color Variations",
        items: [
          "Colors may vary slightly depending on edible printing, lighting, ingredients, and available materials."
        ]
      },
      {
        heading: "Edible Images",
        items: [
          "Edible image prints may show slight differences in color tone, clarity, or resolution once printed."
        ]
      },
      {
        heading: "Weather & Heat Disclaimer",
        items: [
          "Chocolate-covered treats and frosted desserts are temperature sensitive.",
          "We are not responsible for damage caused by exposure to heat, sunlight, or improper storage after pickup or delivery."
        ]
      }
    ]
  },
  {
    title: "Copyright & Trademark Policy",
    intro:
      "Customers confirm they have permission to use logos, images, trademarks, and copyrighted materials submitted for customization.",
    groups: [
      {
        heading: "Customer-Provided Content",
        items: [
          "L&A Amor & Sugar is not responsible for copyright or trademark claims related to customer-provided content."
        ]
      }
    ]
  },
  {
    title: "Content & Design Policy",
    intro: "We reserve the right to refuse orders containing the following:",
    groups: [
      {
        heading: "Refused Content",
        items: [
          "Explicit sexual content",
          "Hate speech",
          "Violence",
          "Discriminatory content",
          "Illegal or offensive material"
        ]
      }
    ]
  },
  {
    title: "Large Orders & Events Policy",
    intro: "For large events or bulk orders, additional planning may be required.",
    groups: [
      {
        heading: "Event Orders",
        items: [
          "Additional preparation time may be required.",
          "Final changes must be communicated in advance.",
          "Certain orders may require a signed agreement and additional deposit."
        ]
      }
    ]
  },
  {
    title: "Photography & Social Media Policy",
    intro:
      "L&A Amor & Sugar may photograph or record completed products for social media, website content, marketing, and promotional purposes.",
    groups: [
      {
        heading: "Privacy Requests",
        items: [
          "Customers requesting complete privacy must notify us in writing before order completion."
        ]
      }
    ]
  },
  {
    title: "Fraud & Chargeback Policy",
    intro:
      "Fraudulent disputes or chargebacks will be contested using order invoices, message records, delivery confirmations, and photos or videos of completed orders.",
    groups: [
      {
        heading: "Future Service",
        items: [
          "We reserve the right to refuse future service to customers involved in fraudulent claims."
        ]
      }
    ]
  },
  {
    title: "Email & SMS Marketing Policy",
    intro:
      "By subscribing to our newsletter or promotions, you agree to receive promotional emails, discounts, product announcements, and order-related updates.",
    groups: [
      {
        heading: "Unsubscribe & Data Sharing",
        items: [
          "You may unsubscribe at any time using the unsubscribe link included in our emails.",
          "We do not sell or share customer information with third parties."
        ]
      }
    ]
  },
  {
    title: "Privacy Policy",
    intro:
      "We may collect name, address, email, phone number, and information necessary to complete orders.",
    groups: [
      {
        heading: "How Information Is Used",
        items: [
          "Processing orders",
          "Customer communication",
          "Improving customer experience",
          "Internal promotions and updates"
        ]
      }
    ]
  },
  {
    title: "Website Terms & Conditions",
    intro:
      "By using amorandsugarla.com, you agree to our Terms of Service, Privacy Policy, Order Policies, and responsible use of the website.",
    groups: [
      {
        heading: "Updates",
        items: [
          "We reserve the right to update products, pricing, and policies at any time without prior notice."
        ]
      }
    ]
  },
  {
    title: "General Disclaimer",
    intro:
      "All products are handmade and crafted individually with care. Minor variations in decoration, color, and presentation are part of the artistic process and are not considered defects.",
    groups: []
  }
];

const highlights = [
  {
    title: "Custom-made orders",
    description: "Every order is handcrafted, so timing, payment, and design details matter.",
    icon: Sparkles
  },
  {
    title: "Allergen awareness",
    description: "Please disclose allergies before ordering; our kitchen handles multiple allergens.",
    icon: TriangleAlert
  },
  {
    title: "Customer protection",
    description: "Policies clarify pickup, delivery, cancellations, privacy, and customer-provided designs.",
    icon: ShieldCheck
  }
];

export const metadata = buildMetadata({
  title: "Order Policies",
  description:
    "Review L&A Amor & Sugar order, allergen, cancellation, custom design, privacy, and website policies before placing an order.",
  path: "/policies"
});

export default function PoliciesPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Policies", path: "/policies" }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Policies"
              title="Order Policies & Terms"
              description="Please review these policies before placing an order with L&A Amor & Sugar."
            />
            <div className="mt-8 grid gap-3">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <div
                    key={highlight.title}
                    className="flex gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bakery-rose/10 text-bakery-rose">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {highlight.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {highlight.description}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {policySections.map((section) => (
              <Card
                key={section.title}
                className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/88 shadow-card backdrop-blur-sm"
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bakery-gold/12 text-bakery-gold">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-serif text-2xl leading-tight text-foreground sm:text-3xl">
                        {section.title}
                      </h2>
                      {section.intro ? (
                        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                          {section.intro}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {section.groups.length ? (
                    <div className="mt-6 grid gap-5">
                      {section.groups.map((group) => (
                        <section key={group.heading}>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-bakery-espresso">
                            {group.heading}
                          </h3>
                          <ul className="mt-3 grid gap-2 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                            {group.items.map((item) => (
                              <li key={item} className="flex gap-3">
                                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-bakery-rose" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
