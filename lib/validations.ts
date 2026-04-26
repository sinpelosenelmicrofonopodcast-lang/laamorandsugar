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
}, z.array(z.string().min(1).max(120)).max(20).nullable().optional());

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
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
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
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
  name: z.string().min(1).max(80),
  quantity: z.coerce.number().int().min(1),
  price: z.coerce.number().positive(),
  stock_quantity: z.coerce.number().int().min(0).nullable().optional(),
  is_default: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const productAddonSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  description: z.string().max(180).optional().nullable(),
  price: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const productImageSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().min(1),
  alt_text: z.string().max(120).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_primary: z.boolean().default(false)
});

export const nutritionFactSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80),
  daily_value: z.string().max(40).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0)
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140),
  short_description: z.string().max(240).optional().nullable(),
  description: z.string().min(20).max(5000),
  sku: z.string().max(60).optional().nullable(),
  nutrition_serving_size: z.string().max(80).optional().nullable(),
  nutrition_servings_per_container: z.string().max(80).optional().nullable(),
  nutrition_facts: z.array(nutritionFactSchema).default([]),
  allergen_statement: z.string().max(240).optional().nullable(),
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
    .min(1, "At least 1 image is required")
    .max(3, "Maximum 3 images per product"),
  variants: z.array(productVariantSchema).min(1, "At least 1 variant is required"),
  addons: z.array(productAddonSchema).default([])
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
  highlight_cards: z.array(aboutHighlightCardSchema).min(1).max(4)
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
    paypal: paymentMethodSettingsSchema,
    cash_app: paymentMethodSettingsSchema,
    zelle: paymentMethodSettingsSchema,
    manual_payment_note: z.string().max(300).optional().nullable()
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

export const cartAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number()
});

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
  addons: z.array(cartAddonSchema).default([])
});

export const checkoutSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_email: z.string().email(),
  customer_phone: z.string().min(7).max(20),
  fulfillment_method: z.enum(FULFILLMENT_METHODS),
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
  items: z.array(cartItemSchema).min(1)
});

export const aiDescriptionSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(120),
  flavor_notes: z.string().max(250).optional().nullable(),
  audience: z.string().max(250).optional().nullable(),
  seasonal: z.boolean().default(false)
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
