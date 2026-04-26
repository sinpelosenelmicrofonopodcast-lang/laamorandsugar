export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "canceled"
] as const;

export const CUSTOM_ORDER_STATUSES = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "declined",
  "completed"
] as const;

export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export const FULFILLMENT_METHODS = ["pickup", "delivery"] as const;
export const USER_ROLES = ["admin", "staff", "customer"] as const;

export const PRODUCT_STATUS = ["active", "draft", "archived"] as const;

export const DEFAULT_BUCKET = "brand-media";

export const DEFAULT_HOMEPAGE_CONTENT = {
  banner_text: "Custom sweets made with love in Killeen, TX",
  banner_cta_label: "Start a custom order",
  banner_cta_href: "/custom-orders",
  seo_title: "L&A Amor & Sugar | Custom Desserts & Sweet Treats in Killeen, TX",
  seo_description:
    "Custom desserts, chocolate-covered strawberries, cake pops, dessert boxes, and seasonal treats made with love in Killeen, TX. Order online or request a custom treat box.",
  hero_eyebrow: "Custom sweets made with love in Killeen, TX",
  hero_title: "Luxury Custom Desserts for Every Sweet Moment",
  hero_description:
    "From chocolate-covered strawberries and cake pops to custom dessert boxes, every treat is made fresh, styled beautifully, and designed to make your moment feel special.",
  hero_primary_cta_label: "Shop treats",
  hero_primary_cta_href: "/shop",
  hero_secondary_cta_label: "Start Custom Order",
  hero_secondary_cta_href: "/custom-orders",
  hero_image_url: null,
  hero_image_alt: "Luxury custom desserts by L&A Amor & Sugar",
  hero_mobile_image_url: null,
  hero_mobile_image_alt: "Luxury custom desserts by L&A Amor & Sugar",
  hero_background_image_url: null,
  hero_background_image_alt: "Soft luxury dessert background",
  featured_heading: "Best Sellers",
  featured_description:
    "Our most-loved treats, perfect for gifts, events, or treating yourself.",
  process_heading: "How It Works",
  process_description:
    "A simple, sweet process from choosing your treats to enjoying the final order.",
  testimonials_heading: "Sweet Words From Our Customers",
  testimonials_description:
    "See why customers come back for gift-ready treats, custom desserts, and sweet moments made beautifully.",
  cta_heading: "Ready to Create Something Sweet?",
  cta_description:
    "Whether it’s a gift, a party, or a custom dessert box, we’re ready to make it beautiful and delicious.",
  content_json: {}
} as const;
