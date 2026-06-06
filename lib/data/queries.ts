/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import { isWithinInterval } from "date-fns";

import { DEFAULT_ABOUT_PAGE_CONTENT, normalizeAboutPageContent } from "@/lib/about-page";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/constants";
import { normalizeHomepageContent } from "@/lib/homepage";
import { normalizeSiteSettings } from "@/lib/payments";
import {
  DEFAULT_SOCIAL_POST_SETTINGS,
  getSocialAutomationDiagnostics,
  getSocialAutomationEnvStatus,
  normalizeSocialPost,
  normalizeSocialPostSettings
} from "@/lib/social-post-manager";
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
  TreatDesignerAddOn,
  TreatDesignerConfig,
  TreatDesignerOptionGroup,
  TreatDesignerOrder,
  TreatDesignerProduct,
  TreatDesignerSprinkleSet,
  SeasonalSpecialRow,
  SocialPostModel,
  SocialPostSettingsModel,
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
  feature_settings: null,
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
  const rawCustomOptions =
    product.custom_options && typeof product.custom_options === "object" && !Array.isArray(product.custom_options)
      ? product.custom_options
      : {};
  const rawOptions =
    rawCustomOptions.customOptions &&
    typeof rawCustomOptions.customOptions === "object" &&
    !Array.isArray(rawCustomOptions.customOptions)
      ? rawCustomOptions.customOptions
      : {};
  const normalizeStringList = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
  const cakeFlavors = normalizeStringList(rawOptions.cakeFlavors);
  const chocolateColors = normalizeStringList(rawOptions.chocolateColors);
  const optionGroups = Array.isArray(rawOptions.optionGroups)
    ? (rawOptions.optionGroups as unknown[])
        .map((group: unknown, index: number) => {
          if (!group || typeof group !== "object" || Array.isArray(group)) {
            return null;
          }

          const rawGroup = group as { id?: unknown; label?: unknown; values?: unknown };
          const label = typeof rawGroup.label === "string" ? rawGroup.label.trim() : "";
          const values = normalizeStringList(rawGroup.values);

          if (!label || values.length === 0) {
            return null;
          }

          return {
            id:
              typeof rawGroup.id === "string" && rawGroup.id.trim()
                ? rawGroup.id.trim()
                : `custom-option-${index + 1}`,
            label,
            values
          };
        })
        .filter((group): group is { id: string; label: string; values: string[] } => Boolean(group))
    : [];
  const fallbackOptionGroups = [
    cakeFlavors.length > 0 ? { id: "cakeFlavor", label: "Cake flavor", values: cakeFlavors } : null,
    chocolateColors.length > 0
      ? { id: "chocolateColor", label: "Chocolate color", values: chocolateColors }
      : null
  ].filter((group): group is { id: string; label: string; values: string[] } => Boolean(group));

  return {
    ...product,
    hasCustomOptions: Boolean(rawCustomOptions.hasCustomOptions),
    customOptions: {
      optionGroups: optionGroups.length > 0 ? optionGroups : fallbackOptionGroups,
      cakeFlavors,
      chocolateColors
    },
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
      .eq("status", "active")
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
    .eq("status", "active")
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

function normalizeTreatDesignerProduct(product: any): TreatDesignerProduct {
  const productImage =
    product.image ??
    resolveImageUrl(
      (product.product_images ?? []).find((image: any) => image.is_primary) ??
        (product.product_images ?? [])[0]
    ) ??
    null;
  const optionGroups = ((product.option_groups ?? []) as any[])
    .map((group): TreatDesignerOptionGroup => ({
      id: group.id,
      product_id: group.product_id,
      name: group.name,
      required: Boolean(group.required),
      active: group.active ?? true,
      sort_order: group.sort_order ?? 0,
      options: ((group.options ?? []) as any[])
        .map((option) => ({
          id: option.id,
          group_id: option.group_id,
          name: option.name,
          price_modifier: Number(option.price_modifier ?? 0),
          image: option.image ?? null,
          color_hex: option.color_hex ?? null,
          active: option.active ?? true,
          sort_order: option.sort_order ?? 0
        }))
        .sort((left, right) => left.sort_order - right.sort_order)
    }))
    .sort((left, right) => left.sort_order - right.sort_order);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    base_price: Number(product.base_price ?? 0),
    min_quantity: Number(product.min_quantity ?? 6),
    image: productImage,
    active: Boolean(product.active),
    status: product.status ?? "active",
    treat_designer_enabled: Boolean(product.treat_designer_enabled),
    treat_designer_featured: Boolean(product.treat_designer_featured),
    enable_sprinkles: Boolean(product.enable_sprinkles),
    enable_logo_upload: Boolean(product.enable_logo_upload),
    enable_live_preview: product.enable_live_preview !== false,
    logo_upload_fee: Number(product.logo_upload_fee ?? 0),
    option_groups: optionGroups
  };
}

const mockTreatDesignerConfig: TreatDesignerConfig = {
  isMock: true,
  products: [
    {
      id: "mock-cake-pops",
      name: "Luxury Designer Pops",
      slug: "cake-pops",
      base_price: 3.75,
      min_quantity: 12,
      image: null,
      active: true,
      status: "active",
      treat_designer_enabled: true,
      treat_designer_featured: true,
      enable_sprinkles: true,
      enable_logo_upload: true,
      enable_live_preview: true,
      logo_upload_fee: 15,
      option_groups: [
        {
          id: "mock-cake-pops-flavor",
          product_id: "mock-cake-pops",
          name: "Flavor",
          required: true,
          active: true,
          sort_order: 0,
          options: [
            {
              id: "mock-cake-pops-vanilla",
              group_id: "mock-cake-pops-flavor",
              name: "Vanilla Bean",
              price_modifier: 0,
              image: null,
              color_hex: null,
              active: true,
              sort_order: 0
            },
            {
              id: "mock-cake-pops-red-velvet",
              group_id: "mock-cake-pops-flavor",
              name: "Red Velvet",
              price_modifier: 6,
              image: null,
              color_hex: null,
              active: true,
              sort_order: 1
            },
            {
              id: "mock-cake-pops-chocolate",
              group_id: "mock-cake-pops-flavor",
              name: "Double Chocolate",
              price_modifier: 4,
              image: null,
              color_hex: null,
              active: true,
              sort_order: 2
            }
          ]
        },
        {
          id: "mock-cake-pops-color",
          product_id: "mock-cake-pops",
          name: "Chocolate Color",
          required: true,
          active: true,
          sort_order: 1,
          options: [
            {
              id: "mock-cake-pops-blush",
              group_id: "mock-cake-pops-color",
              name: "Blush Pink",
              price_modifier: 0,
              image: null,
              color_hex: "#f4b6c4",
              active: true,
              sort_order: 0
            },
            {
              id: "mock-cake-pops-ivory",
              group_id: "mock-cake-pops-color",
              name: "Ivory Pearl",
              price_modifier: 3,
              image: null,
              color_hex: "#fff6e8",
              active: true,
              sort_order: 1
            },
            {
              id: "mock-cake-pops-gold",
              group_id: "mock-cake-pops-color",
              name: "Champagne Gold",
              price_modifier: 8,
              image: null,
              color_hex: "#d4a437",
              active: true,
              sort_order: 2
            }
          ]
        },
        {
          id: "mock-cake-pops-style",
          product_id: "mock-cake-pops",
          name: "Style",
          required: true,
          active: true,
          sort_order: 2,
          options: [
            {
              id: "mock-cake-pops-classic",
              group_id: "mock-cake-pops-style",
              name: "Classic Sprinkle",
              price_modifier: 0,
              image: null,
              color_hex: "#d98ba0",
              active: true,
              sort_order: 0
            },
            {
              id: "mock-cake-pops-drizzle",
              group_id: "mock-cake-pops-style",
              name: "Gold Drizzle",
              price_modifier: 12,
              image: null,
              color_hex: "#c59b45",
              active: true,
              sort_order: 1
            }
          ]
        }
      ]
    },
    {
      id: "mock-cakesicles",
      name: "Cakesicles",
      slug: "cakesicles",
      base_price: 5.5,
      min_quantity: 6,
      image: null,
      active: true,
      status: "active",
      treat_designer_enabled: true,
      treat_designer_featured: false,
      enable_sprinkles: true,
      enable_logo_upload: true,
      enable_live_preview: true,
      logo_upload_fee: 15,
      option_groups: [
        {
          id: "mock-cakesicles-flavor",
          product_id: "mock-cakesicles",
          name: "Flavor",
          required: true,
          active: true,
          sort_order: 0,
          options: [
            {
              id: "mock-cakesicles-vanilla",
              group_id: "mock-cakesicles-flavor",
              name: "Vanilla Cream",
              price_modifier: 0,
              image: null,
              color_hex: null,
              active: true,
              sort_order: 0
            },
            {
              id: "mock-cakesicles-strawberry",
              group_id: "mock-cakesicles-flavor",
              name: "Strawberry Shortcake",
              price_modifier: 5,
              image: null,
              color_hex: null,
              active: true,
              sort_order: 1
            }
          ]
        },
        {
          id: "mock-cakesicles-color",
          product_id: "mock-cakesicles",
          name: "Finish",
          required: true,
          active: true,
          sort_order: 1,
          options: [
            {
              id: "mock-cakesicles-rose",
              group_id: "mock-cakesicles-color",
              name: "Rose Glaze",
              price_modifier: 0,
              image: null,
              color_hex: "#e6a1ad",
              active: true,
              sort_order: 0
            },
            {
              id: "mock-cakesicles-cocoa",
              group_id: "mock-cakesicles-color",
              name: "Cocoa Velvet",
              price_modifier: 4,
              image: null,
              color_hex: "#6a3f2a",
              active: true,
              sort_order: 1
            }
          ]
        }
      ]
    }
  ],
  addOns: [
    {
      id: "mock-addon-logo",
      name: "Logo or edible image",
      price: 15,
      active: true,
      sort_order: 0
    },
    {
      id: "mock-addon-box",
      name: "Luxury gift box",
      price: 12,
      active: true,
      sort_order: 1
    },
    {
      id: "mock-addon-tags",
      name: "Custom favor tags",
      price: 8,
      active: true,
      sort_order: 2
    }
  ],
  sprinkleSets: [
    {
      id: "mock-sprinkles-rose-gold",
      name: "Rose Gold Confetti",
      image_url: null,
      color_hex: "#c59b45",
      price_modifier: 6,
      active: true,
      sort_order: 0
    },
    {
      id: "mock-sprinkles-pearl",
      name: "Pearl Sugar",
      image_url: null,
      color_hex: "#fff8ef",
      price_modifier: 4,
      active: true,
      sort_order: 1
    },
    {
      id: "mock-sprinkles-blush",
      name: "Blush Mix",
      image_url: null,
      color_hex: "#d98ba0",
      price_modifier: 5,
      active: true,
      sort_order: 2
    }
  ]
};

export const getTreatDesignerConfig = cache(async (): Promise<TreatDesignerConfig> => {
  if (!hasSupabaseEnv()) {
    return mockTreatDesignerConfig;
  }

  const supabase = (await createClient()) as any;
  const [
    { data: products, error: productsError },
    { data: addOns, error: addOnsError },
    { data: sprinkleSets, error: sprinkleSetsError }
  ] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,slug,base_price,min_quantity,image,treat_designer_enabled,treat_designer_featured,enable_sprinkles,enable_logo_upload,enable_live_preview,logo_upload_fee,active,status,product_images(*),option_groups(id,product_id,name,required,active,sort_order,options(id,group_id,name,price_modifier,image,color_hex,active,sort_order))"
        )
        .eq("active", true)
        .eq("status", "active")
        .eq("treat_designer_enabled", true)
        .order("treat_designer_featured", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("add_ons")
        .select("id,name,price,active,sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("sprinkle_sets")
        .select("id,name,image_url,color_hex,price_modifier,active,sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
    ]);

  if (productsError || addOnsError || sprinkleSetsError) {
    return mockTreatDesignerConfig;
  }

  const normalizedProducts = ((products ?? []) as any[]).map(normalizeTreatDesignerProduct);
  const normalizedAddOns = ((addOns ?? []) as any[]).map((addon): TreatDesignerAddOn => ({
    id: addon.id,
    name: addon.name,
    price: Number(addon.price ?? 0),
    active: addon.active ?? true,
    sort_order: addon.sort_order ?? 0
  }));
  const normalizedSprinkleSets = ((sprinkleSets ?? []) as any[]).map(
    (sprinkleSet): TreatDesignerSprinkleSet => ({
      id: sprinkleSet.id,
      name: sprinkleSet.name,
      image_url: sprinkleSet.image_url ?? null,
      color_hex: sprinkleSet.color_hex ?? null,
      price_modifier: Number(sprinkleSet.price_modifier ?? 0),
      active: sprinkleSet.active ?? true,
      sort_order: sprinkleSet.sort_order ?? 0
    })
  );

  if (normalizedProducts.length === 0) {
    return mockTreatDesignerConfig;
  }

  return {
    products: normalizedProducts,
    addOns: normalizedAddOns,
    sprinkleSets: normalizedSprinkleSets
  };
});

export const getTreatDesignerAdminConfig = cache(async (): Promise<TreatDesignerConfig> => {
  if (!hasSupabaseEnv()) {
    return { products: [], addOns: [], sprinkleSets: [] };
  }

  const supabase = (await createClient()) as any;
  const [
    { data: products, error: productsError },
    { data: addOns, error: addOnsError },
    { data: sprinkleSets, error: sprinkleSetsError }
  ] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,slug,base_price,min_quantity,image,treat_designer_enabled,treat_designer_featured,enable_sprinkles,enable_logo_upload,enable_live_preview,logo_upload_fee,active,status,product_images(*),option_groups(id,product_id,name,required,active,sort_order,options(id,group_id,name,price_modifier,image,color_hex,active,sort_order))"
        )
        .order("treat_designer_featured", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("add_ons")
        .select("id,name,price,active,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("sprinkle_sets")
        .select("id,name,image_url,color_hex,price_modifier,active,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
    ]);

  if (productsError || addOnsError || sprinkleSetsError) {
    return { products: [], addOns: [], sprinkleSets: [] };
  }

  return {
    products: ((products ?? []) as any[]).map(normalizeTreatDesignerProduct),
    addOns: ((addOns ?? []) as any[]).map((addon): TreatDesignerAddOn => ({
      id: addon.id,
      name: addon.name,
      price: Number(addon.price ?? 0),
      active: addon.active ?? true,
      sort_order: addon.sort_order ?? 0
    })),
    sprinkleSets: ((sprinkleSets ?? []) as any[]).map((sprinkleSet): TreatDesignerSprinkleSet => ({
      id: sprinkleSet.id,
      name: sprinkleSet.name,
      image_url: sprinkleSet.image_url ?? null,
      color_hex: sprinkleSet.color_hex ?? null,
      price_modifier: Number(sprinkleSet.price_modifier ?? 0),
      active: sprinkleSet.active ?? true,
      sort_order: sprinkleSet.sort_order ?? 0
    }))
  };
});

export const getTreatDesignerOrders = cache(async (): Promise<TreatDesignerOrder[]> => {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from("treat_designer_orders")
    .select("*, products(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return ((data ?? []) as any[]).map((order) => ({
    ...order,
    total_price: Number(order.total_price ?? 0)
  })) as TreatDesignerOrder[];
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

export const getNewsletterSubscribers = cache(async () => {
  if (!hasSupabaseEnv()) {
    return [] as {
      id: string;
      email: string;
      discount_code: string;
      discount_used: boolean;
      created_at: string;
      discount_used_at: string | null;
    }[];
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("id,email,discount_code,discount_used,created_at,discount_used_at")
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
  const marketing = await getMarketingDashboardData();

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
    testimonialCount: testimonials.length,
    ...marketing
  };
});

async function safeSelectTable<T = any>(
  supabase: any,
  table: string,
  select = "*"
): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(select);

  if (error) {
    if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST205" || error.code === "PGRST204") {
      return [];
    }

    throw error;
  }

  return (data ?? []) as T[];
}

async function getMarketingDashboardData() {
  if (!hasSupabaseEnv()) {
    return {
      visitsToday: 0,
      uniqueVisitors7d: 0,
      checkoutStarts7d: 0,
      orderSuccess7d: 0,
      conversionRate7d: 0,
      newsletterSubscriberCount: 0,
      newsletterUsedCount: 0,
      pushSubscriberCount: 0,
      openAbandonedCartCount: 0,
      openAbandonedCartValue: 0,
      recoverableAbandonedCartCount: 0,
      recentAbandonedCarts: [] as any[],
      topPages7d: [] as { path: string; views: number }[],
      topProducts7d: [] as { slug: string; views: number }[]
    };
  }

  const supabase = createAdminClient() as any;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [events, subscribers, pushSubscriptions, abandonedCarts] = await Promise.all([
    safeSelectTable<{
      anonymous_id: string | null;
      event_name: string;
      path: string | null;
      cart_subtotal: number | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>(supabase, "website_events", "anonymous_id,event_name,path,cart_subtotal,metadata,created_at"),
    safeSelectTable<{ discount_used: boolean }>(
      supabase,
      "newsletter_subscribers",
      "discount_used"
    ),
    safeSelectTable<{ opted_in: boolean }>(supabase, "push_subscriptions", "opted_in"),
    safeSelectTable<{
      id: string;
      email: string | null;
      subtotal: number;
      status: string;
      last_seen_at: string;
      email_sent_at: string | null;
      converted_order_id: string | null;
    }>(supabase, "abandoned_carts", "id,email,subtotal,status,last_seen_at,email_sent_at,converted_order_id")
  ]);

  const events7d = events.filter((event) => new Date(event.created_at) >= sevenDaysAgo);
  const visitsToday = events.filter(
    (event) => event.event_name === "page_view" && new Date(event.created_at) >= startOfToday
  ).length;
  const uniqueVisitors7d = new Set(
    events7d.map((event) => event.anonymous_id).filter(Boolean)
  ).size;
  const checkoutStarts7d = events7d.filter((event) => event.event_name === "checkout_started").length;
  const orderSuccess7d = events7d.filter((event) => event.event_name === "order_success").length;
  const conversionRate7d = checkoutStarts7d > 0 ? orderSuccess7d / checkoutStarts7d : 0;

  const countBy = (items: string[]) =>
    Object.entries(
      items.reduce<Record<string, number>>((counts, key) => {
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));

  const topPages7d = countBy(
    events7d
      .filter((event) => event.event_name === "page_view" && event.path)
      .map((event) => event.path as string)
  ).map((item) => ({ path: item.key, views: item.count }));
  const topProducts7d = countBy(
    events7d
      .filter((event) => event.event_name === "product_view")
      .map((event) =>
        event.path?.split("?")[0].split("/").filter(Boolean).at(-1) ??
        (typeof event.metadata?.slug === "string" ? event.metadata.slug : "")
      )
      .filter(Boolean)
  ).map((item) => ({ slug: item.key, views: item.count }));
  const openAbandonedCarts = abandonedCarts.filter((cart) =>
    ["open", "emailed", "push_sent"].includes(cart.status)
  );

  return {
    visitsToday,
    uniqueVisitors7d,
    checkoutStarts7d,
    orderSuccess7d,
    conversionRate7d,
    newsletterSubscriberCount: subscribers.length,
    newsletterUsedCount: subscribers.filter((subscriber) => subscriber.discount_used).length,
    pushSubscriberCount: pushSubscriptions.filter((subscription) => subscription.opted_in !== false).length,
    openAbandonedCartCount: openAbandonedCarts.length,
    openAbandonedCartValue: openAbandonedCarts.reduce((sum, cart) => sum + Number(cart.subtotal ?? 0), 0),
    recoverableAbandonedCartCount: openAbandonedCarts.filter((cart) => Boolean(cart.email)).length,
    recentAbandonedCarts: openAbandonedCarts
      .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
      .slice(0, 5),
    topPages7d,
    topProducts7d
  };
}

export const getSocialPostSettings = cache(async (): Promise<SocialPostSettingsModel> => {
  if (!hasSupabaseEnv()) {
    return {
      ...DEFAULT_SOCIAL_POST_SETTINGS,
      schedule_entries: DEFAULT_SOCIAL_POST_SETTINGS.schedule_entries.map((entry) => ({ ...entry })),
      required_lines: [...DEFAULT_SOCIAL_POST_SETTINGS.required_lines],
      cta_phrases_en: [...DEFAULT_SOCIAL_POST_SETTINGS.cta_phrases_en],
      cta_phrases_es: [...DEFAULT_SOCIAL_POST_SETTINGS.cta_phrases_es],
      default_hashtags: [...DEFAULT_SOCIAL_POST_SETTINGS.default_hashtags]
    };
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("social_post_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return normalizeSocialPostSettings(data ?? null);
});

export const getSocialPosts = cache(async ({
  limit = 50,
  history = false
}: {
  limit?: number;
  history?: boolean;
} = {}): Promise<SocialPostModel[]> => {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = (await createClient()) as any;
  let query = supabase
    .from("social_posts")
    .select("*, social_post_publications(*)")
    .order("scheduled_for", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (history) {
    query = query.in("status", ["published", "failed", "canceled"]);
  } else {
    query = query.neq("status", "published");
  }

  const { data } = await query;
  return ((data ?? []) as any[]).map(normalizeSocialPost);
});

export const getSocialPostManagerData = cache(async () => {
  const [settings, queue, history, diagnostics] = await Promise.all([
    getSocialPostSettings(),
    getSocialPosts({ limit: 50, history: false }),
    getSocialPosts({ limit: 30, history: true }),
    getSocialAutomationDiagnostics()
  ]);

  const publishedCount = history.filter((post) => post.status === "published").length;
  const failedCount = history.filter((post) => post.status === "failed").length;

  return {
    settings,
    queue,
    history,
    integrations: getSocialAutomationEnvStatus(),
    diagnostics,
    summary: {
      queuedCount: queue.filter((post) => post.status === "scheduled" || post.status === "draft").length,
      publishedCount,
      failedCount
    }
  };
});

export const getMarketingAdminData = cache(async () => {
  if (!hasSupabaseEnv()) {
    return {
      campaigns: [] as any[],
      abandonedCarts: [] as any[],
      emailEvents: [] as any[],
      subscribers: [] as any[],
      pushSubscriptions: [] as any[]
    };
  }

  const supabase = createAdminClient() as any;
  const [campaigns, abandonedCarts, emailEvents, subscribers, pushSubscriptions] = await Promise.all([
    safeSelectTable(supabase, "notification_campaigns", "*"),
    safeSelectTable(supabase, "abandoned_carts", "*"),
    safeSelectTable(supabase, "email_events", "*"),
    safeSelectTable(supabase, "newsletter_subscribers", "id,email,discount_used,created_at"),
    safeSelectTable(supabase, "push_subscriptions", "id,email,opted_in,last_seen_at,created_at")
  ]);

  return {
    campaigns: campaigns
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 25),
    abandonedCarts: abandonedCarts
      .sort((a: any, b: any) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
      .slice(0, 25),
    emailEvents: emailEvents
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 25),
    subscribers,
    pushSubscriptions
  };
});
