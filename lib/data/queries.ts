/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import { isWithinInterval } from "date-fns";

import { DEFAULT_ABOUT_PAGE_CONTENT, normalizeAboutPageContent } from "@/lib/about-page";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/constants";
import { normalizeHomepageContent } from "@/lib/homepage";
import { normalizeSiteSettings } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type {
  CategoryRow,
  CouponRow,
  CustomOrderRow,
  AboutPageContentModel,
  AboutPageContentRow,
  HomepageContentModel,
  HomepageContentRow,
  MediaAssetRow,
  ProfileRow,
  OrderWithItems,
  CustomerAccountOrder,
  ProductWithRelations,
  SeasonalSpecialRow,
  SiteSettingsRow,
  TestimonialRow
} from "@/lib/types/app";
import { resolveImageUrl, resolveVariantPrice, resolveVariantQuantity } from "@/lib/utils";

const fallbackSettings = normalizeSiteSettings({
  id: "fallback-settings",
  business_name: "L&A Amor & Sugar Co.",
  tagline: "Made with love by mom & her girls",
  support_email: "hello@amorandsugarco.com",
  support_phone: "(555) 555-0147",
  instagram_url: "https://instagram.com",
  facebook_url: "https://facebook.com",
  tiktok_url: "https://tiktok.com",
  address: "Houston, Texas",
  business_hours: {
    monday: "9am - 6pm",
    tuesday: "9am - 6pm",
    wednesday: "9am - 6pm",
    thursday: "9am - 6pm",
    friday: "9am - 6pm",
    saturday: "10am - 4pm"
  },
  delivery_zones: ["Houston", "Sugar Land", "Katy"],
  pickup_instructions: "Pickup details are shared after order confirmation.",
  free_delivery_threshold: 150,
  currency: "USD",
  payment_settings: null,
  updated_at: new Date().toISOString()
} as SiteSettingsRow);

const fallbackTestimonials: TestimonialRow[] = [
  {
    id: "testimonial-1",
    customer_name: "Natalie G.",
    rating: 5,
    quote:
      "Our berry box looked like a boutique gift and tasted even better. It made the baby shower table feel instantly elevated.",
    occasion: "Baby Shower",
    featured: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "testimonial-2",
    customer_name: "Jasmin R.",
    rating: 5,
    quote:
      "Beautiful finishing, great communication, and the cupcakes were gone before the party ended. We are definitely ordering again.",
    occasion: "Birthday Dinner",
    featured: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

function buildFallbackHomepage(): HomepageContentModel {
  return normalizeHomepageContent({
    id: "fallback-homepage",
    ...DEFAULT_HOMEPAGE_CONTENT,
    updated_at: new Date().toISOString()
  } as HomepageContentRow);
}

function buildFallbackAboutPage(): AboutPageContentModel {
  return {
    ...DEFAULT_ABOUT_PAGE_CONTENT,
    gallery_images: [],
    highlight_cards: DEFAULT_ABOUT_PAGE_CONTENT.highlight_cards.map((card) => ({ ...card })),
    updated_at: new Date().toISOString()
  };
}

function normalizeProduct(product: any): ProductWithRelations {
  return {
    ...product,
    nutrition_facts: (Array.isArray(product.nutrition_facts) ? product.nutrition_facts : [])
      .map((fact: any, index: number) => ({
        label:
          fact && typeof fact === "object" && "label" in fact && typeof fact.label === "string"
            ? fact.label
            : "",
        value:
          fact && typeof fact === "object" && "value" in fact && typeof fact.value === "string"
            ? fact.value
            : "",
        daily_value:
          fact &&
          typeof fact === "object" &&
          "daily_value" in fact &&
          typeof fact.daily_value === "string"
            ? fact.daily_value
            : null,
        sort_order:
          fact &&
          typeof fact === "object" &&
          "sort_order" in fact &&
          typeof fact.sort_order === "number"
            ? fact.sort_order
            : index
      }))
      .filter((fact: { label: string; value: string }) => fact.label && fact.value)
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
    product_images: (product.product_images ?? [])
      .map((image: any) => ({
        ...image,
        image_url: resolveImageUrl(image)
      }))
      .filter((image: { image_url: string | null }) => Boolean(image.image_url)),
    product_variants: (product.product_variants ?? []).map((variant: any) => ({
      ...variant,
      quantity: resolveVariantQuantity(variant),
      price: resolveVariantPrice(variant, product.base_price ?? 0)
    }))
  } as ProductWithRelations;
}

export const getHomepageContent = cache(async (): Promise<HomepageContentModel> => {
  if (!hasSupabaseEnv()) {
    return buildFallbackHomepage();
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("homepage_content")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? normalizeHomepageContent(data as HomepageContentRow) : buildFallbackHomepage();
});

export const getAboutPageContent = cache(async (): Promise<AboutPageContentModel> => {
  if (!hasSupabaseEnv()) {
    return buildFallbackAboutPage();
  }

  const supabase = (await createClient()) as any;
  const [{ data }, { data: mediaAssets }] = await Promise.all([
    supabase
      .from("about_page_content")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("media_assets")
      .select("public_url, alt_text")
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const aboutContent = normalizeAboutPageContent((data ?? null) as AboutPageContentRow | null);

  if (aboutContent.gallery_images.length > 0) {
    return aboutContent;
  }

  const fallbackGallery =
    (mediaAssets ?? [])
      .filter(
        (asset: { public_url?: string | null; alt_text?: string | null }) =>
          typeof asset.public_url === "string" && asset.public_url.trim().length > 0
      )
      .slice(0, 6)
      .map((asset: { public_url: string; alt_text?: string | null }, index: number) => ({
        image_url: asset.public_url,
        alt_text:
          asset.alt_text?.trim() || `L&A Amor & Sugar treat gallery image ${index + 1}`
      })) ?? [];

  return {
    ...aboutContent,
    gallery_images: fallbackGallery
  };
});

export const getSiteSettings = cache(async () => {
  if (!hasSupabaseEnv()) {
    return fallbackSettings;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? normalizeSiteSettings(data as SiteSettingsRow) : fallbackSettings;
});

export const getCategories = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as CategoryRow[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return data ?? [];
});

export const getProducts = cache(
  async ({
    featuredOnly = false,
    seasonalOnly = false
  }: {
    featuredOnly?: boolean;
    seasonalOnly?: boolean;
  } = {}) => {
    if (!hasSupabaseEnv()) {
      return [] as ProductWithRelations[];
    }

  const supabase = (await createClient()) as any;
  let query = supabase
      .from("products")
      .select(
        "*, categories(*), product_images(*), product_variants(*), product_addons(*)"
      )
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (featuredOnly) {
      query = query.eq("featured", true);
    }

    if (seasonalOnly) {
      query = query.eq("seasonal", true);
    }

    const { data } = await query;

    return ((data ?? []) as any[]).map(normalizeProduct);
  }
);

export const getAllProductsAdmin = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as ProductWithRelations[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("products")
    .select(
      "*, categories(*), product_images(*), product_variants(*), product_addons(*)"
    )
    .order("created_at", { ascending: false });

  return ((data ?? []) as any[]).map(normalizeProduct);
});

export const getProductBySlug = cache(async (slug: string) => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("products")
    .select(
      "*, categories(*), product_images(*), product_variants(*), product_addons(*)"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  return data ? normalizeProduct(data) : null;
});

export const getProductByIdAdmin = cache(async (id: string) => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("products")
    .select(
      "*, categories(*), product_images(*), product_variants(*), product_addons(*)"
    )
    .eq("id", id)
    .maybeSingle();

  return data ? normalizeProduct(data) : null;
});

export const getTestimonials = cache(async () => {
  if (!hasSupabaseEnv()) {
    return fallbackTestimonials;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true });

  return data?.length ? data : fallbackTestimonials;
});

export const getActiveSeasonalSpecials = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as SeasonalSpecialRow[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("seasonal_specials")
    .select("*")
    .eq("is_active", true)
    .order("starts_at", { ascending: false });

  const now = new Date();
  return ((data ?? []) as SeasonalSpecialRow[]).filter((special: SeasonalSpecialRow) =>
    isWithinInterval(now, {
      start: new Date(special.starts_at),
      end: new Date(special.ends_at)
    })
  );
});

export const getSeasonalSpecials = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as SeasonalSpecialRow[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("seasonal_specials")
    .select("*")
    .order("starts_at", { ascending: false });

  return data ?? [];
});

export const getCoupons = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as CouponRow[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
});

export const getOrders = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as OrderWithItems[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_messages(*), order_status_history(*)")
    .order("created_at", { ascending: false });

  return (data as unknown as OrderWithItems[]) ?? [];
});

export const getOrderById = cache(async (orderId: string) => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_messages(*), order_status_history(*)")
    .eq("id", orderId)
    .maybeSingle();

  return (data as unknown as OrderWithItems | null) ?? null;
});

export const getOrderByAccessToken = cache(async (token: string) => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_messages(*), order_status_history(*)")
    .eq("order_access_token", token)
    .maybeSingle();

  return (data as unknown as OrderWithItems | null) ?? null;
});

export async function getOrdersForUser(userId: string) {
  if (!hasSupabaseEnv()) {
    return [] as CustomerAccountOrder[];
  }

  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_messages(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data as CustomerAccountOrder[]) ?? [];
}

export async function getProfileById(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createAdminClient() as any;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  return (data as ProfileRow | null) ?? null;
}

export const getCustomOrders = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as CustomOrderRow[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("custom_orders")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
});

export const getCustomOrderById = cache(async (customOrderId: string) => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("custom_orders")
    .select("*")
    .eq("id", customOrderId)
    .maybeSingle();

  return data ?? null;
});

export const getMediaAssets = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as MediaAssetRow[];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
});

export const getAdminDashboardData = cache(async () => {
  const [orders, customOrders, products, testimonials] = await Promise.all([
    getOrders(),
    getCustomOrders(),
    getProducts(),
    getTestimonials()
  ]);

  const totalRevenue = orders.reduce(
    (sum: number, order: OrderWithItems) => sum + order.total,
    0
  );
  const openOrders = orders.filter((order: OrderWithItems) => order.status !== "delivered").length;
  const pendingQuotes = customOrders.filter(
    (order: CustomOrderRow) => order.status === "new" || order.status === "reviewing"
  ).length;
  const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;

  return {
    totalRevenue,
    openOrders,
    pendingQuotes,
    averageOrderValue,
    recentOrders: orders.slice(0, 5),
    productCount: products.length,
    testimonialCount: testimonials.length
  };
});
