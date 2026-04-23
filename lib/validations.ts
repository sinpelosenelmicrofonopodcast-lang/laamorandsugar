import { z } from "zod";

import {
  CUSTOM_ORDER_STATUSES,
  DISCOUNT_TYPES,
  FULFILLMENT_METHODS,
  ORDER_STATUSES,
  PRODUCT_STATUS,
  USER_ROLES
} from "@/lib/constants";

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

export const homepageSchema = z.object({
  banner_text: z.string().max(120).optional().nullable(),
  banner_cta_label: z.string().max(60).optional().nullable(),
  banner_cta_href: z.string().max(180).optional().nullable(),
  hero_eyebrow: z.string().max(80).optional().nullable(),
  hero_title: z.string().max(140).optional().nullable(),
  hero_description: z.string().max(500).optional().nullable(),
  hero_primary_cta_label: z.string().max(60).optional().nullable(),
  hero_primary_cta_href: z.string().max(180).optional().nullable(),
  hero_secondary_cta_label: z.string().max(60).optional().nullable(),
  hero_secondary_cta_href: z.string().max(180).optional().nullable(),
  featured_heading: z.string().max(140).optional().nullable(),
  featured_description: z.string().max(500).optional().nullable(),
  process_heading: z.string().max(140).optional().nullable(),
  process_description: z.string().max(500).optional().nullable(),
  testimonials_heading: z.string().max(140).optional().nullable(),
  testimonials_description: z.string().max(500).optional().nullable(),
  cta_heading: z.string().max(140).optional().nullable(),
  cta_description: z.string().max(500).optional().nullable()
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
  currency: z.string().length(3).default("USD")
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES)
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
export type HomepageValues = z.infer<typeof homepageSchema>;
export type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;
