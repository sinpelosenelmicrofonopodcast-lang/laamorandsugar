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
  banner_text: "Spring event bookings are open now",
  banner_cta_label: "Reserve your date",
  banner_cta_href: "/custom-orders",
  hero_eyebrow: "Luxury treats crafted with heart",
  hero_title: "Pastel confections styled for moments worth remembering",
  hero_description:
    "Hand-finished dessert boxes, dipped berries, cupcakes, and celebration bundles made with love by mom & her girls.",
  hero_primary_cta_label: "Shop treats",
  hero_primary_cta_href: "/shop",
  hero_secondary_cta_label: "Start a custom order",
  hero_secondary_cta_href: "/custom-orders",
  featured_heading: "Best sellers for gifting, showers, and birthdays",
  featured_description:
    "A premium mix of berries, cupcakes, and custom sweets designed to feel elevated from the very first bite.",
  process_heading: "How it works",
  process_description:
    "Choose a ready-to-order box or send us your inspiration and event details. We handle design, finishing, and delivery prep with care.",
  testimonials_heading: "Sweet notes from our clients",
  testimonials_description:
    "Families, brides, and busy hosts come back for desserts that look polished and taste just as special.",
  cta_heading: "Need something custom for your next event?",
  cta_description:
    "Tell us your date, colors, budget, and ideas. We will review your request and follow up with a personalized quote."
} as const;
