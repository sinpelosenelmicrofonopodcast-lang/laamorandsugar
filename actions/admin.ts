"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getErrorMessage, slugify } from "@/lib/utils";
import {
  categorySchema,
  couponSchema,
  homepageSchema,
  productSchema,
  seasonalSpecialSchema,
  siteSettingsSchema,
  testimonialSchema,
  updateCustomOrderStatusSchema,
  updateOrderStatusSchema
} from "@/lib/validations";
import type { HomepageContentRow, SiteSettingsRow } from "@/lib/types/app";

function normalizeString(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

async function insertProductImages(
  supabase: any,
  productId: string,
  images: {
    image_url: string;
    alt_text?: string | null;
    sort_order: number;
    is_primary: boolean;
  }[]
) {
  const rows = images.map((image) => ({
    product_id: productId,
    image_url: image.image_url,
    alt_text: normalizeString(image.alt_text ?? null),
    sort_order: image.sort_order,
    is_primary: image.is_primary
  }));

  const { error } = await supabase.from("product_images").insert(rows);

  if (!error) {
    return;
  }

  if (
    error.code === "PGRST204" &&
    typeof error.message === "string" &&
    error.message.includes("'image_url'")
  ) {
    const legacyRows = rows.map(({ image_url, ...rest }) => ({
      ...rest,
      url: image_url
    }));
    const { error: legacyError } = await supabase.from("product_images").insert(legacyRows);

    if (legacyError) {
      throw legacyError;
    }

    return;
  }

  throw error;
}

async function insertProductVariants(
  supabase: any,
  productId: string,
  basePrice: number,
  variants: {
    name: string;
    quantity: number;
    price: number;
    stock_quantity?: number | null;
    is_default: boolean;
    sort_order: number;
  }[]
) {
  const rows = variants.map((variant) => ({
    product_id: productId,
    name: variant.name,
    quantity: variant.quantity,
    price: variant.price,
    option_value: `${variant.quantity} pcs`,
    price_delta: 0,
    stock_quantity: variant.stock_quantity ?? null,
    is_default: variant.is_default,
    sort_order: variant.sort_order
  }));

  const { error } = await supabase.from("product_variants").insert(rows);

  if (!error) {
    return;
  }

  if (
    error.code === "PGRST204" &&
    typeof error.message === "string" &&
    (error.message.includes("'price'") || error.message.includes("'quantity'"))
  ) {
    const legacyRows = variants.map((variant) => ({
      product_id: productId,
      name: variant.name,
      option_value: `${variant.quantity} pcs`,
      price_delta: variant.price - basePrice,
      stock_quantity: variant.stock_quantity ?? null,
      is_default: variant.is_default,
      sort_order: variant.sort_order
    }));

    const { error: legacyError } = await supabase.from("product_variants").insert(legacyRows);

    if (legacyError) {
      throw legacyError;
    }

    return;
  }

  throw error;
}

async function saveProductRecord(
  supabase: any,
  productId: string | undefined,
  payload: Record<string, unknown>,
  legacySafePayload: Record<string, unknown>
) {
  const query = productId
    ? supabase.from("products").update(payload).eq("id", productId).select("id, slug").single()
    : supabase.from("products").insert(payload).select("id, slug").single();

  const { data, error } = await query;

  if (!error) {
    return { data, error: null };
  }

  if (
    error.code === "PGRST204" &&
    typeof error.message === "string" &&
    (error.message.includes("nutrition_") || error.message.includes("'allergen_statement'"))
  ) {
    return productId
      ? await supabase
          .from("products")
          .update(legacySafePayload)
          .eq("id", productId)
          .select("id, slug")
          .single()
      : await supabase
          .from("products")
          .insert(legacySafePayload)
          .select("id, slug")
          .single();
  }

  return { data: null, error };
}

export async function upsertCategoryAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = categorySchema.parse(input);
    const supabase = createAdminClient() as any;

    const payload = {
      name: values.name,
      slug: values.slug,
      description: normalizeString(values.description ?? null),
      image_url: normalizeString(values.image_url ?? null),
      sort_order: values.sort_order
    };

    const query = values.id
      ? supabase.from("categories").update(payload).eq("id", values.id)
      : supabase.from("categories").insert(payload);

    const { error } = await query;

    if (error) {
      throw error;
    }

    revalidatePath("/shop");
    revalidatePath("/admin/categories");

    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);

    if (error) {
      throw error;
    }

    revalidatePath("/shop");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertProductAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = productSchema.parse(input);
    const supabase = createAdminClient() as any;
    const normalizedSlug = slugify(values.slug || values.name);

    const duplicateSlugQuery = supabase
      .from("products")
      .select("id, name")
      .eq("slug", normalizedSlug)
      .limit(1);
    const { data: duplicateSlug } = values.id
      ? await duplicateSlugQuery.neq("id", values.id).maybeSingle()
      : await duplicateSlugQuery.maybeSingle();

    if (duplicateSlug) {
      return {
        error: `This slug is already being used by "${duplicateSlug.name}". Please change the slug and try again.`
      };
    }

    const nutritionPayload = {
      nutrition_serving_size: normalizeString(values.nutrition_serving_size ?? null),
      nutrition_servings_per_container: normalizeString(
        values.nutrition_servings_per_container ?? null
      ),
      nutrition_facts:
        values.nutrition_facts.length > 0
          ? values.nutrition_facts
              .map((fact) => ({
                label: fact.label.trim(),
                value: fact.value.trim(),
                daily_value: normalizeString(fact.daily_value ?? null),
                sort_order: fact.sort_order
              }))
              .sort((a, b) => a.sort_order - b.sort_order)
          : null,
      allergen_statement: normalizeString(values.allergen_statement ?? null)
    };
    const productPayloadBase = {
      category_id: values.category_id ?? null,
      name: values.name,
      slug: normalizedSlug,
      short_description: normalizeString(values.short_description ?? null),
      description: values.description,
      sku: normalizeString(values.sku ?? null),
      base_price:
        values.variants.find((variant) => variant.is_default)?.price ??
        values.variants[0]?.price ??
        values.base_price,
      featured: values.featured,
      seasonal: values.seasonal,
      stock_quantity: values.stock_quantity ?? null,
      lead_time_days: values.lead_time_days,
      status: values.status,
      pickup_only: values.pickup_only,
      delivery_available: values.delivery_available,
      active: values.active
    };
    const productPayload = {
      ...productPayloadBase,
      ...nutritionPayload
    };

    const { data: product, error: productError } = await saveProductRecord(
      supabase,
      values.id,
      productPayload,
      productPayloadBase
    );

    if (productError || !product) {
      throw productError ?? new Error("Unable to save product");
    }

    await Promise.all([
      supabase.from("product_images").delete().eq("product_id", product.id),
      supabase.from("product_variants").delete().eq("product_id", product.id),
      supabase.from("product_addons").delete().eq("product_id", product.id)
    ]);

    if (values.images.length > 0) {
      await insertProductImages(supabase, product.id, values.images);
    }

    if (values.variants.length > 0) {
      await insertProductVariants(
        supabase,
        product.id,
        productPayloadBase.base_price,
        values.variants
      );
    }

    if (values.addons.length > 0) {
      const { error } = await supabase.from("product_addons").insert(
        values.addons.map((addon) => ({
          product_id: product.id,
          name: addon.name,
          description: normalizeString(addon.description ?? null),
          price: addon.price,
          is_active: addon.is_active,
          sort_order: addon.sort_order
        }))
      );

      if (error) {
        throw error;
      }
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);

    return { success: true, productId: product.id };
  } catch (error) {
    console.error("upsertProductAction failed", error);
    return { error: getErrorMessage(error) };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertCouponAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = couponSchema.parse(input);
    const supabase = createAdminClient() as any;

    const payload = {
      code: values.code,
      description: normalizeString(values.description ?? null),
      discount_type: values.discount_type,
      discount_value: values.discount_value,
      minimum_order_amount: values.minimum_order_amount ?? null,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
      usage_limit: values.usage_limit ?? null,
      active: values.active
    };

    const query = values.id
      ? supabase.from("coupons").update(payload).eq("id", values.id)
      : supabase.from("coupons").insert(payload);

    const { error } = await query;

    if (error) {
      throw error;
    }

    revalidatePath("/checkout");
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteCouponAction(couponId: string) {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("coupons").delete().eq("id", couponId);

    if (error) {
      throw error;
    }

    revalidatePath("/checkout");
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateOrderStatusAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = updateOrderStatusSchema.parse(input);
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("orders")
      .update({ status: values.status })
      .eq("id", values.orderId);

    if (error) {
      throw error;
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${values.orderId}`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateCustomOrderStatusAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = updateCustomOrderStatusSchema.parse(input);
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("custom_orders")
      .update({ status: values.status })
      .eq("id", values.customOrderId);

    if (error) {
      throw error;
    }

    revalidatePath("/admin/custom-orders");
    revalidatePath(`/admin/custom-orders/${values.customOrderId}`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertHomepageContentAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = homepageSchema.parse(input);
    const supabase = createAdminClient() as any;

    const legacyPayload = {
      banner_text: normalizeString(values.banner_text ?? null),
      banner_cta_label: normalizeString(values.banner_cta_label ?? null),
      banner_cta_href: normalizeString(values.banner_cta_href ?? null),
      hero_eyebrow: normalizeString(values.hero_eyebrow ?? null),
      hero_title: normalizeString(values.hero_title ?? null),
      hero_description: normalizeString(values.hero_description ?? null),
      hero_primary_cta_label: normalizeString(values.hero_primary_cta_label ?? null),
      hero_primary_cta_href: normalizeString(values.hero_primary_cta_href ?? null),
      hero_secondary_cta_label: normalizeString(values.hero_secondary_cta_label ?? null),
      hero_secondary_cta_href: normalizeString(values.hero_secondary_cta_href ?? null),
      featured_heading: normalizeString(values.featured_heading ?? null),
      featured_description: normalizeString(values.featured_description ?? null),
      process_heading: normalizeString(values.process_heading ?? null),
      process_description: normalizeString(values.process_description ?? null),
      testimonials_heading: normalizeString(values.testimonials_heading ?? null),
      testimonials_description: normalizeString(values.testimonials_description ?? null),
      cta_heading: normalizeString(values.cta_heading ?? null),
      cta_description: normalizeString(values.cta_description ?? null)
    };

    const payload = {
      ...legacyPayload,
      seo_title: normalizeString(values.seo_title ?? null),
      seo_description: normalizeString(values.seo_description ?? null),
      hero_image_url: normalizeString(values.hero_image_url ?? null),
      hero_image_alt: normalizeString(values.hero_image_alt ?? null),
      hero_mobile_image_url: normalizeString(values.hero_mobile_image_url ?? null),
      hero_mobile_image_alt: normalizeString(values.hero_mobile_image_alt ?? null),
      hero_background_image_url: normalizeString(values.hero_background_image_url ?? null),
      hero_background_image_alt: normalizeString(values.hero_background_image_alt ?? null),
      content_json: values.content_json
    };

    const { data: existing } = (await supabase
      .from("homepage_content")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: Pick<HomepageContentRow, "id"> | null };

    const runQuery = (queryPayload: Record<string, unknown>) =>
      existing?.id
        ? supabase.from("homepage_content").update(queryPayload).eq("id", existing.id)
        : supabase.from("homepage_content").insert(queryPayload);

    let { error } = await runQuery(payload);

    if (
      error?.code === "PGRST204" &&
      typeof error.message === "string" &&
      (error.message.includes("'content_json'") ||
        error.message.includes("'seo_title'") ||
        error.message.includes("'seo_description'") ||
        error.message.includes("'hero_image_url'") ||
        error.message.includes("'hero_mobile_image_url'") ||
        error.message.includes("'hero_background_image_url'"))
    ) {
      ({ error } = await runQuery(legacyPayload));
    }

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertSeasonalSpecialAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = seasonalSpecialSchema.parse(input);
    const supabase = createAdminClient() as any;

    const payload = {
      title: values.title,
      subtitle: normalizeString(values.subtitle ?? null),
      description: normalizeString(values.description ?? null),
      cta_label: normalizeString(values.cta_label ?? null),
      cta_href: normalizeString(values.cta_href ?? null),
      image_url: normalizeString(values.image_url ?? null),
      starts_at: values.starts_at,
      ends_at: values.ends_at,
      is_active: values.is_active
    };

    const query = values.id
      ? supabase.from("seasonal_specials").update(payload).eq("id", values.id)
      : supabase.from("seasonal_specials").insert(payload);

    const { error } = await query;

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/admin/specials");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteSeasonalSpecialAction(specialId: string) {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("seasonal_specials")
      .delete()
      .eq("id", specialId);

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/admin/specials");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertTestimonialAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = testimonialSchema.parse(input);
    const supabase = createAdminClient() as any;

    const payload = {
      customer_name: values.customer_name,
      rating: values.rating,
      quote: values.quote,
      occasion: normalizeString(values.occasion ?? null),
      featured: values.featured,
      sort_order: values.sort_order
    };

    const query = values.id
      ? supabase.from("testimonials").update(payload).eq("id", values.id)
      : supabase.from("testimonials").insert(payload);

    const { error } = await query;

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/reviews");
    revalidatePath("/admin/testimonials");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteTestimonialAction(testimonialId: string) {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", testimonialId);

    if (error) {
      throw error;
    }

    revalidatePath("/reviews");
    revalidatePath("/admin/testimonials");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertSiteSettingsAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = siteSettingsSchema.parse(input);
    const supabase = createAdminClient() as any;
    const { data: existing } = (await supabase
      .from("site_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: Pick<SiteSettingsRow, "id"> | null };
    const { payment_settings: paymentSettings, ...baseValues } = values;

    const legacyPayload = {
      ...baseValues,
      tagline: normalizeString(values.tagline ?? null),
      support_email: normalizeString(values.support_email ?? null),
      support_phone: normalizeString(values.support_phone ?? null),
      instagram_url: normalizeString(values.instagram_url ?? null),
      facebook_url: normalizeString(values.facebook_url ?? null),
      tiktok_url: normalizeString(values.tiktok_url ?? null),
      address: normalizeString(values.address ?? null),
      pickup_instructions: normalizeString(values.pickup_instructions ?? null)
    };
    const payload = {
      ...legacyPayload,
      payment_settings: paymentSettings
    };

    const runQuery = (queryPayload: Record<string, unknown>) =>
      existing?.id
        ? supabase.from("site_settings").update(queryPayload).eq("id", existing.id)
        : supabase.from("site_settings").insert(queryPayload);

    let { error } = await runQuery(payload);

    if (
      error?.code === "PGRST204" &&
      typeof error.message === "string" &&
      error.message.includes("'payment_settings'")
    ) {
      const legacyResult = await runQuery(legacyPayload);
      error = legacyResult.error;
    }

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/contact");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
