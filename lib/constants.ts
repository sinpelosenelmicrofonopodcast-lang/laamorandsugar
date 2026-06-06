export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "canceled"
] as const;

export const CUSTOMER_ORDER_STATUS_VALUES = [
  "pending_review",
  "confirmed",
  "payment_pending",
  "paid",
  "in_progress",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled"
] as const;

export const PAYMENT_STATUS_VALUES = ["pending", "paid", "failed", "refunded"] as const;

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
  seo_title: "Gifts that make people say WOW before they even taste them. | L&A Amor & Sugar",
  seo_description:
    "Luxury chocolate-covered strawberries, dessert boxes, and edible arrangements made to impress every time. Pickup and delivery available in Killeen, TX.",
  hero_eyebrow: "Luxury sweet gifting in Killeen, TX",
  hero_title: "Gifts that make people say WOW before they even taste them.",
  hero_description:
    "Luxury chocolate-covered strawberries, dessert boxes, and edible arrangements made to impress every time.",
  hero_primary_cta_label: "Order Now",
  hero_primary_cta_href: "/shop",
  hero_secondary_cta_label: "Start Custom Order",
  hero_secondary_cta_href: "/custom-orders",
  hero_image_url: null,
  hero_image_alt: "Luxury custom desserts by L&A Amor & Sugar",
  hero_mobile_image_url: null,
  hero_mobile_image_alt: "Luxury custom desserts by L&A Amor & Sugar",
  hero_background_image_url: null,
  hero_background_image_alt: "Soft luxury dessert background",
  featured_heading: "Everyone’s Ordering These Right Now",
  featured_description:
    "Our most wanted treats — the ones that get reactions every single time.",
  process_heading: "How It Works",
  process_description:
    "A simple, sweet process from choosing your treats to enjoying the final order.",
  testimonials_heading: "Sweet Words From Our Customers",
  testimonials_description:
    "See why customers come back for gift-ready treats, custom desserts, and sweet moments made beautifully.",
  cta_heading: "Don’t wait until it’s too late.",
  cta_description:
    "Order now and secure your spot.",
  content_json: {}
} as const;
