import { z } from "zod";

import {
  CUSTOM_ORDER_STATUSES,
  CUSTOMER_ORDER_STATUS_VALUES,
  DISCOUNT_TYPES,
  FULFILLMENT_METHODS,
  ORDER_STATUSES,
  PAYMENT_STATUS_VALUES,
  PRODUCT_STATUS,
  USER_ROLES
} from "@/lib/constants";
import { HOMEPAGE_ICON_OPTIONS } from "@/lib/homepage";

const businessHoursSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}, z.record(z.string()).nullable().optional());

const deliveryZonesSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : value;
    } catch {
      return trimmed
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return value;
}, z.array(
  z.union([
    z.string().min(1).max(120),
    z.object({
      id: z.string().min(1).max(140),
      type: z.enum(["pickup", "delivery"]),
      label: z.string().min(1).max(120),
      fee: z.coerce.number().min(0)
    })
  ])
).max(40).nullable().optional());

function emptyStringToNull(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function isBlankText(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

function filterBlankNutritionFacts(value: unknown) {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.filter((fact) => {
    if (!fact || typeof fact !== "object") {
      return true;
    }

    const record = fact as Record<string, unknown>;
    return !(
      isBlankText(record.label) &&
      isBlankText(record.value) &&
      isBlankText(record.daily_value)
    );
  });
}

function filterBlankAddons(value: unknown) {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.filter((addon) => {
    if (!addon || typeof addon !== "object") {
      return true;
    }

    const record = addon as Record<string, unknown>;
    const price = Number(record.price ?? 0);
    return !(isBlankText(record.name) && isBlankText(record.description) && price === 0);
  });
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[a-z]/, "Include at least 1 lowercase letter.")
  .regex(/[A-Z]/, "Include at least 1 uppercase letter.")
  .regex(/[0-9]/, "Include at least 1 number.")
  .regex(/[^A-Za-z0-9]/, "Include at least 1 symbol.");

export const customerSignUpSchema = z
  .object({
    full_name: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

const paymentMethodSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  label: z.string().max(80),
  account: z.string().max(160).optional().nullable(),
  payment_url: z.string().max(400).optional().nullable(),
  instructions: z.string().max(300).optional().nullable()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const customerProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20)
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url().optional().or(z.literal("")).nullable(),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Add a variant name.").max(80),
  quantity: z.coerce.number().int().min(1),
  price: z.coerce.number().positive(),
  stock_quantity: z.coerce.number().int().min(0).nullable().optional(),
  is_default: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const productAddonSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Add an add-on name.").max(80),
  description: z.string().max(180).optional().nullable(),
  price: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const productImageSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().min(1, "Add an image URL or upload an image."),
  alt_text: z.string().max(120).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_primary: z.boolean().default(false)
});

export const nutritionFactSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Add a nutrition fact label.").max(80),
  value: z.string().min(1, "Add a nutrition fact value.").max(80),
  daily_value: z.string().max(40).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const customOptionGroupSchema = z.object({
  id: z.string().max(80).optional(),
  label: z.string().min(1, "Add an option group name.").max(80),
  values: z.array(z.string().max(80)).default([])
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.preprocess(emptyStringToNull, z.string().uuid().optional().nullable()),
  name: z.string().min(2, "Add a product name.").max(120),
  slug: z.string().min(2, "Add a product slug.").max(140),
  short_description: z.string().max(240).optional().nullable(),
  description: z.string().min(20, "Add a product description with at least 20 characters.").max(5000),
  sku: z.string().max(60).optional().nullable(),
  nutrition_serving_size: z.string().max(80).optional().nullable(),
  nutrition_servings_per_container: z.string().max(80).optional().nullable(),
  nutrition_facts: z.preprocess(
    filterBlankNutritionFacts,
    z.array(nutritionFactSchema).default([])
  ),
  allergen_statement: z.string().max(240).optional().nullable(),
  hasCustomOptions: z.boolean().default(false),
  customOptions: z.object({
    optionGroups: z.array(customOptionGroupSchema).default([]),
    cakeFlavors: z.array(z.string().min(1).max(80)).default([]),
    chocolateColors: z.array(z.string().min(1).max(80)).default([])
  }).default({
    optionGroups: [],
    cakeFlavors: [],
    chocolateColors: []
  }),
  base_price: z.coerce.number().min(0).default(0),
  featured: z.boolean().default(false),
  seasonal: z.boolean().default(false),
  stock_quantity: z.coerce.number().int().min(0).nullable().optional(),
  lead_time_days: z.coerce.number().int().min(0).default(2),
  status: z.enum(PRODUCT_STATUS).default("active"),
  pickup_only: z.boolean().default(false),
  delivery_available: z.boolean().default(true),
  active: z.boolean().default(true),
  images: z
    .array(productImageSchema)
    .min(1, "Add at least 1 product image.")
    .max(3, "Maximum 3 images per product"),
  variants: z.array(productVariantSchema).min(1, "Add at least 1 product variant."),
  addons: z.preprocess(filterBlankAddons, z.array(productAddonSchema).default([]))
}).superRefine((value, ctx) => {
  const primaryImages = value.images.filter((image) => image.is_primary).length;
  const defaultVariants = value.variants.filter((variant) => variant.is_default).length;

  if (primaryImages !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Exactly 1 primary image is required",
      path: ["images"]
    });
  }

  if (defaultVariants !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Exactly 1 default variant is required",
      path: ["variants"]
    });
  }
});

export const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(3).max(32).transform((value) => value.toUpperCase()),
  description: z.string().max(240).optional().nullable(),
  discount_type: z.enum(DISCOUNT_TYPES),
  discount_value: z.coerce.number().positive(),
  minimum_order_amount: z.coerce.number().min(0).optional().nullable(),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  usage_limit: z.coerce.number().int().min(1).optional().nullable(),
  active: z.boolean().default(true)
});

export const customOrderSchema = z.object({
  customer_name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  event_type: z.string().min(2).max(100),
  event_date: z.string().min(1),
  quantity: z.string().min(1).max(80),
  budget: z.coerce.number().min(0).optional().nullable(),
  colors_theme: z.string().max(160).optional().nullable(),
  description: z.string().min(20).max(4000),
  inspiration_image_url: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(CUSTOM_ORDER_STATUSES).optional()
});

export const testimonialSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().min(2).max(100),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().min(12).max(500),
  occasion: z.string().max(80).optional().nullable(),
  featured: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

const aboutGalleryImageSchema = z.object({
  image_url: z.string().max(400).optional().nullable().transform((value) => value ?? ""),
  alt_text: z.string().max(180).optional().nullable().transform((value) => value ?? "")
});

const aboutHighlightCardSchema = z.object({
  title: z.string().min(1).max(80),
  text: z.string().min(1).max(220)
});

const aboutCredentialItemSchema = z.object({
  title: z.string().min(1).max(120),
  credential_type: z.string().min(1).max(80),
  issuer: z.string().min(1).max(120),
  issued_at: z.string().max(80).optional().nullable().transform((value) => value ?? ""),
  description: z.string().max(280).optional().nullable().transform((value) => value ?? ""),
  document_url: z.string().max(500).optional().nullable().transform((value) => value ?? ""),
  button_label: z.string().max(60).optional().nullable().transform((value) => value ?? ""),
  visible: z.boolean().default(true)
});

export const aboutPageSchema = z.object({
  hero_eyebrow: z.string().min(1).max(80),
  hero_title: z.string().min(1).max(140),
  hero_text: z.string().min(1).max(500),
  hero_image_url: z.string().max(400).optional().nullable(),
  hero_image_alt: z.string().max(180).optional().nullable(),
  section_one_title: z.string().min(1).max(140),
  section_one_text: z.string().min(1).max(600),
  section_two_title: z.string().min(1).max(140),
  section_two_text: z.string().min(1).max(600),
  style_title: z.string().min(1).max(140),
  style_text: z.string().min(1).max(500),
  cta_title: z.string().min(1).max(140),
  cta_text: z.string().min(1).max(400),
  cta_button_text: z.string().min(1).max(60),
  cta_button_link: z.string().min(1).max(180),
  gallery_images: z.array(aboutGalleryImageSchema).max(6),
  highlight_cards: z.array(aboutHighlightCardSchema).min(1).max(4),
  credential_items: z.array(aboutCredentialItemSchema).max(8)
}).superRefine((value, ctx) => {
  if (
    value.gallery_images.some((image) => {
      const hasUrl = image.image_url.trim().length > 0;
      const hasAlt = image.alt_text.trim().length > 0;
      return hasUrl !== hasAlt;
    })
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Each gallery image needs both an image URL and alt text.",
      path: ["gallery_images"]
    });
  }
});

export const seasonalSpecialSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  subtitle: z.string().max(160).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  cta_label: z.string().max(60).optional().nullable(),
  cta_href: z.string().max(200).optional().nullable(),
  image_url: z.string().max(400).optional().nullable(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  is_active: z.boolean().default(true)
});

const homepageIconSchema = z.enum(HOMEPAGE_ICON_OPTIONS as [string, ...string[]]);

const homepageImageAssetSchema = z.object({
  image_url: z.string().max(400).optional().nullable().transform((value) => value ?? ""),
  alt_text: z.string().max(180).optional().nullable().transform((value) => value ?? ""),
  title: z.string().max(120).optional().nullable(),
  caption: z.string().max(200).optional().nullable(),
  description: z.string().max(400).optional().nullable(),
  asset_id: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0 ? null : value,
      z.string().min(1).optional().nullable()
    )
});

const homepageStepSchema = z.object({
  title: z.string().min(1).max(80),
  text: z.string().min(1).max(240),
  icon: homepageIconSchema
});

const homepagePromiseCardSchema = z.object({
  title: z.string().min(1).max(80),
  text: z.string().min(1).max(240),
  icon: homepageIconSchema
});

const homepageHeroContentSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  headline: z.string().min(1).max(140),
  subheadline: z.string().min(1).max(500),
  urgency: z.string().min(1).max(220),
  cta_primary: z.string().min(1).max(60),
  cta_secondary: z.string().min(1).max(60),
  micro_copy: z.string().min(1).max(180),
  badge: z.string().min(1).max(120),
  image_badge: z.string().min(1).max(80),
  image_title: z.string().min(1).max(180),
  chips: z.array(z.string().min(1).max(60)).min(1).max(6),
  reserve_card_title: z.string().min(1).max(80),
  reserve_card_text: z.string().min(1).max(240),
  delivery_card_title: z.string().min(1).max(80),
  delivery_card_text: z.string().min(1).max(240)
});

const homepageBestSellersCopySchema = z.object({
  title: z.string().min(1).max(140),
  subtitle: z.string().min(1).max(500)
});

const homepageFinalCtaCopySchema = z.object({
  title: z.string().min(1).max(140),
  text: z.string().min(1).max(500)
});

const homepageCustomOrderCopySchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(500)
});

export const homepageSchema = z.object({
  banner_text: z.string().max(120).optional().nullable(),
  banner_cta_label: z.string().max(60).optional().nullable(),
  banner_cta_href: z.string().max(180).optional().nullable(),
  seo_title: z.string().max(160).optional().nullable(),
  seo_description: z.string().max(320).optional().nullable(),
  hero_eyebrow: z.string().max(80).optional().nullable(),
  hero_title: z.string().max(140).optional().nullable(),
  hero_description: z.string().max(500).optional().nullable(),
  hero_primary_cta_label: z.string().max(60).optional().nullable(),
  hero_primary_cta_href: z.string().max(180).optional().nullable(),
  hero_secondary_cta_label: z.string().max(60).optional().nullable(),
  hero_secondary_cta_href: z.string().max(180).optional().nullable(),
  hero_image_url: z.string().max(400).optional().nullable(),
  hero_image_alt: z.string().max(180).optional().nullable(),
  hero_mobile_image_url: z.string().max(400).optional().nullable(),
  hero_mobile_image_alt: z.string().max(180).optional().nullable(),
  hero_background_image_url: z.string().max(400).optional().nullable(),
  hero_background_image_alt: z.string().max(180).optional().nullable(),
  featured_heading: z.string().max(140).optional().nullable(),
  featured_description: z.string().max(500).optional().nullable(),
  process_heading: z.string().max(140).optional().nullable(),
  process_description: z.string().max(500).optional().nullable(),
  testimonials_heading: z.string().max(140).optional().nullable(),
  testimonials_description: z.string().max(500).optional().nullable(),
  cta_heading: z.string().max(140).optional().nullable(),
  cta_description: z.string().max(500).optional().nullable(),
  content_json: z.object({
    sections_order: z
      .array(
        z.enum([
          "featured",
          "custom_orders",
          "how_it_works",
          "seasonal",
          "trust",
          "testimonials",
          "gallery",
          "final_cta"
        ])
      )
      .min(1),
    home_content: z.object({
      hero: homepageHeroContentSchema,
      best_sellers: homepageBestSellersCopySchema,
      about: z.string().min(1).max(1200),
      occasions_heading: z.string().min(1).max(80),
      occasions: z.array(z.string().min(1).max(80)).min(1).max(8),
      delivery: z.string().min(1).max(500),
      urgency_section: z.string().min(1).max(800),
      final_cta: homepageFinalCtaCopySchema,
      custom_order: homepageCustomOrderCopySchema
    }),
    featured: z.object({
      is_enabled: z.boolean().default(true),
      product_ids: z.array(z.string().min(1)).default([])
    }),
    custom_orders: z.object({
      is_enabled: z.boolean().default(true),
      title: z.string().min(1).max(140),
      description: z.string().min(1).max(500),
      image_url: z.string().max(400).optional().nullable(),
      image_alt: z.string().max(180),
      bullets: z.array(z.string().min(1).max(80)).min(1).max(12),
      button_text: z.string().min(1).max(60),
      button_link: z.string().min(1).max(180)
    }),
    how_it_works: z.object({
      is_enabled: z.boolean().default(true),
      title: z.string().min(1).max(140),
      steps: z.array(homepageStepSchema).min(3).max(4)
    }),
    seasonal: z.object({
      is_enabled: z.boolean().default(true),
      title: z.string().min(1).max(140),
      subtitle: z.string().min(1).max(500),
      image_url: z.string().max(400).optional().nullable(),
      image_alt: z.string().max(180),
      button_text: z.string().min(1).max(60),
      button_link: z.string().min(1).max(180),
      product_ids: z.array(z.string().min(1)).default([]),
      special_ids: z.array(z.string().min(1)).default([])
    }),
    trust: z.object({
      is_enabled: z.boolean().default(true),
      title: z.string().min(1).max(140),
      description: z.string().max(500),
      cards: z.array(homepagePromiseCardSchema).min(3).max(4)
    }),
    testimonials: z.object({
      is_enabled: z.boolean().default(true),
      selected_ids: z.array(z.string().min(1)).default([])
    }),
    gallery: z.object({
      is_enabled: z.boolean().default(true),
      title: z.string().min(1).max(140),
      images: z.array(homepageImageAssetSchema).max(12)
    }),
    final_cta: z.object({
      is_enabled: z.boolean().default(true),
      title: z.string().min(1).max(140),
      text: z.string().min(1).max(500),
      button_text: z.string().min(1).max(60),
      button_link: z.string().min(1).max(180),
      background_image_url: z.string().max(400).optional().nullable(),
      background_image_alt: z.string().max(180)
    })
  })
}).superRefine((value, ctx) => {
  if (
    value.content_json.gallery.is_enabled &&
    value.content_json.gallery.images.length > 0 &&
    value.content_json.gallery.images.some(
      (image) => !image.image_url?.trim() || !image.alt_text?.trim()
    )
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Every gallery image needs both an image URL and alt text.",
      path: ["content_json", "gallery", "images"]
    });
  }
});

export const siteSettingsSchema = z.object({
  business_name: z.string().min(2).max(120),
  tagline: z.string().max(160).optional().nullable(),
  support_email: z.string().email().optional().or(z.literal("")).nullable(),
  support_phone: z.string().max(30).optional().nullable(),
  instagram_url: z.string().url().optional().or(z.literal("")).nullable(),
  facebook_url: z.string().url().optional().or(z.literal("")).nullable(),
  tiktok_url: z.string().url().optional().or(z.literal("")).nullable(),
  address: z.string().max(250).optional().nullable(),
  business_hours: businessHoursSchema,
  delivery_zones: deliveryZonesSchema,
  pickup_instructions: z.string().max(500).optional().nullable(),
  free_delivery_threshold: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().length(3).default("USD"),
  payment_settings: z.object({
    stripe: paymentMethodSettingsSchema,
    paypal_live: paymentMethodSettingsSchema,
    paypal: paymentMethodSettingsSchema,
    cash_app: paymentMethodSettingsSchema,
    zelle: paymentMethodSettingsSchema,
    manual_payment_note: z.string().max(300).optional().nullable()
  }),
  feature_settings: z.object({
    treat_designer_enabled: z.boolean(),
    treat_designer_disabled_message: z.string().max(300).optional().nullable()
  })
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES)
});

export const updateCustomerOrderWorkflowSchema = z.object({
  orderId: z.string().uuid(),
  order_status: z.enum(CUSTOMER_ORDER_STATUS_VALUES),
  note: z.string().max(600).optional().nullable(),
  customer_visible: z.boolean().default(true),
  estimated_ready_at: z.string().optional().nullable(),
  pickup_date: z.string().optional().nullable(),
  delivery_date: z.string().optional().nullable(),
  internal_notes: z.string().max(2000).optional().nullable(),
  payment_status: z.enum(PAYMENT_STATUS_VALUES).optional().nullable()
});

export const orderMessageSchema = z.object({
  orderId: z.string().uuid(),
  message_body: z.string().min(1).max(2000),
  attachment_url: z.string().max(400).optional().nullable(),
  customer_visible: z.boolean().default(true)
});

export const customerOrderMessageSchema = z.object({
  order_token: z.string().min(20),
  message_body: z.string().min(1).max(2000),
  attachment_url: z.string().max(400).optional().nullable()
});

export const orderLookupSchema = z
  .object({
    order_number: z.string().min(4).max(40),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    phone: z.string().min(7).max(20).optional().or(z.literal("")).nullable()
  })
  .refine((value) => Boolean(value.email?.trim() || value.phone?.trim()), {
    message: "Enter the email or phone number used on the order.",
    path: ["email"]
  });

export const saveOrderPushSubscriptionSchema = z.object({
  order_token: z.string().min(20),
  subscription_id: z.string().min(1).max(200)
});

export const updateCustomOrderStatusSchema = z.object({
  customOrderId: z.string().uuid(),
  status: z.enum(CUSTOM_ORDER_STATUSES)
});

export const roleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(USER_ROLES)
});

export const treatDesignerProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  base_price: z.coerce.number().min(0),
  min_quantity: z.coerce.number().int().min(1).default(6),
  image: z.string().max(500).optional().nullable(),
  treat_designer_enabled: z.boolean().default(true),
  treat_designer_featured: z.boolean().default(false),
  enable_sprinkles: z.boolean().default(false),
  enable_logo_upload: z.boolean().default(false),
  enable_live_preview: z.boolean().default(true),
  logo_upload_fee: z.coerce.number().min(0).default(0)
});

export const treatOptionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  required: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const treatOptionSchema = z.object({
  id: z.string().uuid().optional(),
  group_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  price_modifier: z.coerce.number().min(0).default(0),
  image: z.string().max(500).optional().nullable(),
  color_hex: z.string().max(20).optional().nullable(),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const treatAddOnSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  price: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const treatSprinkleSetSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  image_url: z.string().max(500).optional().nullable(),
  color_hex: z.string().max(20).optional().nullable(),
  price_modifier: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const treatDesignerOrderSchema = z.object({
  productId: z.string().uuid(),
  selectedOptions: z.array(z.string().uuid()).default([]),
  addOns: z.array(z.string().uuid()).default([]),
  sprinkles: z.string().uuid().optional().nullable(),
  logo: z.object({
    url: z.string().url(),
    fileName: z.string().max(180).optional().nullable()
  }).optional().nullable(),
  config: z.record(z.unknown()).optional(),
  previewImageUrl: z.string().url().optional().nullable(),
  quantity: z.coerce.number().int().min(1),
  customNotes: z.string().max(1200).optional().nullable(),
  totalPrice: z.coerce.number().min(0),
  createdAt: z.string().optional()
});

export const cartAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number()
});

const customSelectionSchema = z.record(z.string().min(1).max(800)).default({});

export const cartItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(99),
  variantId: z.string().nullable().optional(),
  variantName: z.string().nullable().optional(),
  variantQuantity: z.number().int().min(1).nullable().optional(),
  customOptions: customSelectionSchema.optional(),
  addons: z.array(cartAddonSchema).default([])
});

export const checkoutSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_email: z.string().email(),
  customer_phone: z.string().min(7).max(20),
  fulfillment_method: z.enum(FULFILLMENT_METHODS),
  fulfillment_option_id: z.string().max(140).optional().nullable(),
  payment_method: z.enum(["stripe", "paypal_live", "paypal", "cash_app", "zelle"]),
  fulfillment_date: z.string().min(1),
  fulfillment_time_slot: z.string().max(120).optional().nullable(),
  notes: z.string().max(800).optional().nullable(),
  coupon_code: z.string().max(32).optional().nullable(),
  delivery_address_line_1: z.string().max(120).optional().nullable(),
  delivery_address_line_2: z.string().max(120).optional().nullable(),
  delivery_city: z.string().max(80).optional().nullable(),
  delivery_state: z.string().max(80).optional().nullable(),
  delivery_zip: z.string().max(20).optional().nullable(),
  items: z.array(cartItemSchema).min(1),
  policies_acknowledged: z
    .boolean()
    .refine((value) => value, "Please confirm that you understand our allergen statement and ordering policies.")
});

export const aiDescriptionSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(120),
  flavor_notes: z.string().max(250).optional().nullable(),
  audience: z.string().max(250).optional().nullable(),
  seasonal: z.boolean().default(false)
});

const socialPlatformSchema = z.enum(["instagram", "facebook"]);

export const socialScheduleEntrySchema = z.object({
  id: z.string().min(2).max(40),
  label: z.string().min(2).max(40),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"),
  enabled: z.boolean().default(true),
  platforms: z.array(socialPlatformSchema).min(1).max(2)
});

export const socialPostSettingsSchema = z.object({
  automation_enabled: z.boolean().default(true),
  timezone: z.string().min(3).max(80).default("America/Chicago"),
  queue_days_ahead: z.coerce.number().int().min(0).max(14).default(2),
  schedule_entries: z.array(socialScheduleEntrySchema).min(1).max(8),
  required_lines: z.array(z.string().min(4).max(180)).min(1).max(8),
  cta_phrases_en: z.array(z.string().min(4).max(120)).min(1).max(12),
  cta_phrases_es: z.array(z.string().min(4).max(120)).min(1).max(12),
  default_hashtags: z.array(z.string().min(2).max(40)).max(15).default([]),
  hashtags_enabled: z.boolean().default(true),
  tone_notes: z.string().max(400).optional().nullable()
});

export const socialPostSchema = z.object({
  id: z.string().uuid().optional(),
  scheduled_for: z.string().optional().nullable(),
  status: z.enum(["draft", "scheduled", "publishing", "published", "canceled", "failed"]).optional(),
  platforms: z.array(socialPlatformSchema).min(1).max(2),
  image_url: z.string().url("Enter a valid image URL"),
  product_name: z.string().min(2).max(160),
  product_price: z.coerce.number().min(0).optional().nullable(),
  product_description: z.string().max(5000).optional().nullable(),
  caption_en: z.string().min(10).max(2200),
  caption_es: z.string().min(10).max(2200),
  cta_en: z.string().min(2).max(160).optional().nullable(),
  cta_es: z.string().min(2).max(160).optional().nullable(),
  combined_caption: z.string().min(10).max(4500),
  hashtags: z.array(z.string().min(2).max(40)).max(15).default([])
});

export const socialPostIdSchema = z.object({
  postId: z.string().uuid()
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CouponFormValues = z.infer<typeof couponSchema>;
export type CustomOrderValues = z.infer<typeof customOrderSchema>;
export type CheckoutValues = z.infer<typeof checkoutSchema>;
export type OrderLookupValues = z.infer<typeof orderLookupSchema>;
export type AboutPageValues = z.infer<typeof aboutPageSchema>;
export type HomepageValues = z.infer<typeof homepageSchema>;
export type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type CustomerSignUpValues = z.infer<typeof customerSignUpSchema>;
export type CustomerProfileValues = z.infer<typeof customerProfileSchema>;
export type SocialPostSettingsValues = z.infer<typeof socialPostSettingsSchema>;
export type SocialPostValues = z.infer<typeof socialPostSchema>;
