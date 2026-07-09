import type { ProductWithRelations, SiteSettingsRow } from "@/lib/types/app";
import { absoluteUrl, formatCurrency } from "@/lib/utils";
import {
  getProductDescription,
  getProductPrimaryImage,
  getProductStartingPrice
} from "@/lib/product-presentation";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildOrganizationJsonLd(settings: SiteSettingsRow) {
  const sameAs = [
    settings.instagram_url,
    settings.facebook_url,
    settings.tiktok_url
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "Bakery"],
    "@id": absoluteUrl("/#organization"),
    name: settings.business_name ?? "L&A Amor & Sugar Co.",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/la-logo-official.png"),
    image: absoluteUrl("/brand/og-cover.svg"),
    telephone: settings.support_phone,
    email: settings.support_email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Killeen",
      addressRegion: "TX",
      addressCountry: "US",
      streetAddress: settings.address ?? undefined
    },
    areaServed: [
      { "@type": "City", name: "Killeen" },
      { "@type": "Place", name: "Fort Cavazos" },
      { "@type": "City", name: "Harker Heights" },
      { "@type": "City", name: "Copperas Cove" },
      { "@type": "City", name: "Temple" },
      { "@type": "City", name: "Belton" },
      { "@type": "State", name: "Texas" }
    ],
    priceRange: "$$",
    servesCuisine: "Dessert gifts, chocolate-covered strawberries, custom treats",
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Local dessert delivery" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Pickup dessert gifts" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom dessert boxes" } }
    ],
    sameAs
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: "L&A Amor & Sugar",
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/shop")}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function buildProductJsonLd(product: ProductWithRelations) {
  const image = getProductPrimaryImage(product);
  const price = getProductStartingPrice(product);
  const description = getProductDescription(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/products/${product.slug}#product`),
    name: product.name,
    description,
    image: image ? [image] : [absoluteUrl("/products/placeholder-elegance.svg")],
    sku: product.slug,
    mpn: product.id,
    productID: product.id,
    category: product.categories?.name ?? "Luxury dessert gifts",
    brand: {
      "@type": "Brand",
      name: "L&A Amor & Sugar"
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "USD",
      price: price.toFixed(2),
      availability: product.stock_quantity === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "L&A Amor & Sugar"
      },
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .slice(0, 10),
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        merchantReturnDays: 0
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        name: "Local pickup and delivery arranged at checkout",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
          addressRegion: "TX"
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 3,
            unitCode: "DAY"
          }
        }
      }
    }
  };
}

export function buildLocalServiceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  areaServed?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": absoluteUrl(`${input.path}#service`),
    name: input.name,
    description: input.description,
    provider: {
      "@type": "LocalBusiness",
      name: "L&A Amor & Sugar",
      url: absoluteUrl("/")
    },
    areaServed: (input.areaServed ?? ["Killeen", "Fort Cavazos", "Harker Heights", "Copperas Cove", "Belton", "Temple", "Central Texas"]).map((name) => ({
      "@type": "Place",
      name
    })),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(input.path)
    }
  };
}

export function buildBlogPostingJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    image: absoluteUrl("/brand/og-cover.svg"),
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    author: {
      "@type": "Organization",
      name: "L&A Amor & Sugar"
    },
    publisher: {
      "@type": "Organization",
      name: "L&A Amor & Sugar",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/la-logo-official.png")
      }
    },
    mainEntityOfPage: absoluteUrl(input.path)
  };
}

export function buildMenuJsonLd(products: ProductWithRelations[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": absoluteUrl("/menu#luxury-dessert-menu"),
    name: "Luxury Sweet Gifts Menu",
    description:
      "Luxury dessert gifts, chocolate-covered strawberries, custom cake pops, dessert boxes, and personalized treats in Killeen, TX.",
    itemListElement: products.slice(0, 24).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      item: {
        "@type": "Product",
        name: product.name,
        description: getProductDescription(product),
        image: getProductPrimaryImage(product) ?? absoluteUrl("/products/placeholder-elegance.svg"),
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: getProductStartingPrice(product).toFixed(2),
          url: absoluteUrl(`/products/${product.slug}`)
        }
      }
    }))
  };
}

export function buildFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function buildAdminOrderAlertText(input: {
  orderNumber: string;
  customerName: string;
  total: number;
}) {
  return `New order ${input.orderNumber} from ${input.customerName} for ${formatCurrency(input.total)}.`;
}
