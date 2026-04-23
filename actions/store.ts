"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getStripe } from "@/lib/stripe";
import { getSiteSettings } from "@/lib/data/queries";
import type { ProductRow } from "@/lib/types/app";
import {
  getErrorMessage,
  resolveImageUrl,
  resolveVariantPrice,
  resolveVariantQuantity
} from "@/lib/utils";
import { checkoutSchema, customOrderSchema } from "@/lib/validations";

type CheckoutProduct = Pick<ProductRow, "id" | "name" | "slug" | "base_price"> & {
  product_images?: { image_url?: string | null; url?: string | null; is_primary?: boolean }[];
};

type CheckoutVariant = {
  id: string;
  product_id: string;
  name: string;
  quantity?: number | null;
  price?: number | null;
  option_value?: string | null;
  price_delta?: number | null;
};

type CheckoutAddon = {
  id: string;
  product_id: string;
  name: string;
  price: number;
};

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function submitCustomOrderAction(input: unknown) {
  try {
    if (!hasSupabaseEnv()) {
      return {
        error:
          "Configure Supabase before submitting custom orders. See the README setup steps."
      };
    }

    const values = customOrderSchema.parse(input);
    const supabase = createAdminClient() as any;

    const { error } = await supabase.from("custom_orders").insert({
      ...values,
      status: values.status ?? "new",
      inspiration_image_url: values.inspiration_image_url || null,
      colors_theme: values.colors_theme || null,
      notes: values.notes || null
    });

    if (error) {
      throw error;
    }

    revalidatePath("/admin/custom-orders");

    return {
      success: true
    };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function createCheckoutSessionAction(input: unknown) {
  try {
    if (!hasSupabaseEnv()) {
      return {
        error: "Supabase is not configured yet."
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        error: "Stripe is not configured yet."
      };
    }

    const values = checkoutSchema.parse(input);
    const supabase = createAdminClient() as any;
    const stripe = getStripe();
    const settings = await getSiteSettings();

    const productIds = [...new Set(values.items.map((item) => item.productId))];
    const variantIds = [
      ...new Set(values.items.map((item) => item.variantId).filter(Boolean))
    ] as string[];

    const [{ data: products }, { data: variants }, { data: addons }] =
      await Promise.all([
        supabase
          .from("products")
          .select("id,name,slug,base_price,product_images(*)")
          .in("id", productIds),
        variantIds.length
          ? supabase
              .from("product_variants")
              .select("*")
              .in("id", variantIds)
          : Promise.resolve({ data: [] as never[], error: null }),
        productIds.length
          ? supabase
              .from("product_addons")
              .select("id,product_id,name,price")
              .in("product_id", productIds)
          : Promise.resolve({ data: [] as never[], error: null })
      ]);

    const typedProducts = ((products ?? []) as CheckoutProduct[]).map((product) => ({
      ...product,
      product_images: (product.product_images ?? [])
        .map((image) => ({
          ...image,
          image_url: resolveImageUrl(image)
        }))
        .filter((image) => Boolean(image.image_url))
    }));
    const typedVariants = ((variants ?? []) as CheckoutVariant[]).map((variant) => {
      const product = typedProducts.find((item) => item.id === variant.product_id);

      return {
        ...variant,
        quantity: resolveVariantQuantity(variant),
        price: resolveVariantPrice(variant, product?.base_price ?? 0)
      };
    });
    const typedAddons = (addons ?? []) as CheckoutAddon[];

    const productMap = new Map(
      typedProducts.map((product: CheckoutProduct) => [product.id, product])
    );
    const variantMap = new Map(
      typedVariants.map((variant: CheckoutVariant) => [variant.id, variant])
    );
    const addonMap = new Map(
      typedAddons.map((addon: CheckoutAddon) => [addon.id, addon])
    );

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: {
      product_id: string;
      variant_id: string | null;
      product_name: string;
      variant_name: string | null;
      unit_price: number;
      quantity: number;
      addons: { id: string; name: string; price: number }[];
      image_url: string | null;
    }[] = [];

    let subtotal = 0;

    for (const cartItem of values.items) {
      const product = productMap.get(cartItem.productId);

      if (!product) {
        return {
          error: "One of the selected products no longer exists."
        };
      }

      const variant = cartItem.variantId ? variantMap.get(cartItem.variantId) : null;
      const selectedAddons = cartItem.addons
        .map((addon) => addonMap.get(addon.id))
        .filter(Boolean) as CheckoutAddon[];
      const unitPrice =
        (variant?.price ?? product.base_price) +
        selectedAddons.reduce((sum, addon) => sum + (addon?.price ?? 0), 0);
      const itemSubtotal = unitPrice * cartItem.quantity;

      subtotal += itemSubtotal;

      lineItems.push({
        quantity: cartItem.quantity,
        price_data: {
          currency: settings.currency.toLowerCase(),
          unit_amount: Math.round(unitPrice * 100),
          product_data: {
            name:
              variant?.name
                ? `${product.name} - ${variant.name} (${variant.quantity} pcs)`
                : product.name,
            images:
              product.product_images
                ?.sort(
                  (a: { is_primary?: boolean }, b: { is_primary?: boolean }) =>
                    Number(b.is_primary) - Number(a.is_primary)
                )
                .map((image: { image_url?: string | null }) => image.image_url)
                .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
                .slice(0, 1) ?? [],
            description:
              selectedAddons.length > 0
                ? `Add-ons: ${selectedAddons.map((addon) => addon.name).join(", ")}`
                : undefined
          }
        }
      });

      orderItems.push({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: product.name,
        variant_name: variant?.name ? `${variant.name} (${variant.quantity} pcs)` : null,
        unit_price: unitPrice,
        quantity: cartItem.quantity,
        addons: selectedAddons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          price: addon.price
        })),
        image_url: product.product_images?.[0]?.image_url ?? cartItem.image ?? null
      });
    }

    let discountTotal = 0;

    if (values.coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", values.coupon_code.toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (coupon) {
        if (
          !coupon.minimum_order_amount ||
          subtotal >= coupon.minimum_order_amount
        ) {
          discountTotal =
            coupon.discount_type === "percentage"
              ? subtotal * (coupon.discount_value / 100)
              : coupon.discount_value;
          discountTotal = Math.min(discountTotal, subtotal);
        }
      }
    }

    const deliveryFee =
      values.fulfillment_method === "delivery" &&
      (!settings.free_delivery_threshold ||
        subtotal - discountTotal < settings.free_delivery_threshold)
        ? 20
        : 0;

    const taxTotal = 0;
    const total = subtotal - discountTotal + deliveryFee + taxTotal;
    const orderId = randomUUID();
    const orderNumber = `LAS-${Date.now().toString().slice(-8)}`;

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      customer_name: values.customer_name,
      customer_email: values.customer_email,
      customer_phone: values.customer_phone,
      fulfillment_method: values.fulfillment_method,
      fulfillment_date: values.fulfillment_date,
      fulfillment_time_slot: values.fulfillment_time_slot || null,
      notes: values.notes || null,
      subtotal,
      discount_total: discountTotal,
      delivery_fee: deliveryFee,
      tax_total: taxTotal,
      total,
      status: "pending",
      shipping_address:
        values.fulfillment_method === "delivery"
          ? {
              line1: values.delivery_address_line_1,
              line2: values.delivery_address_line_2,
              city: values.delivery_city,
              state: values.delivery_state,
              zip: values.delivery_zip
            }
          : null,
      metadata: {
        coupon_code: values.coupon_code ?? null
      }
    });

    if (orderError) {
      throw orderError;
    }

    const { error: orderItemsError } = await supabase.from("order_items").insert(
      orderItems.map((item) => ({
        order_id: orderId,
        ...item
      }))
    );

    if (orderItemsError) {
      throw orderItemsError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: values.customer_email,
      success_url: `${getSiteUrl()}/order-success?order=${orderId}`,
      cancel_url: `${getSiteUrl()}/checkout?canceled=1`,
      payment_method_types: ["card"],
      metadata: {
        order_id: orderId,
        order_number: orderNumber
      },
      line_items: [
        ...lineItems,
        ...(deliveryFee > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: settings.currency.toLowerCase(),
                  unit_amount: Math.round(deliveryFee * 100),
                  product_data: {
                    name: "Local delivery"
                  }
                }
              }
            ]
          : [])
      ]
    });

    await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id
      })
      .eq("id", orderId);

    return {
      success: true,
      url: session.url
    };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function generateProductDescriptionAction(input: unknown) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      error:
        "Set OPENAI_API_KEY to enable AI-generated product descriptions."
    };
  }

  try {
    const payload = input as {
      name?: string;
      category?: string;
      flavor_notes?: string;
      audience?: string;
      seasonal?: boolean;
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You write polished bakery product copy for a premium feminine brand. Return strict JSON with keys title, shortDescription, longDescription."
          },
          {
            role: "user",
            content: `Product name: ${payload.name}\nCategory: ${payload.category}\nFlavor notes: ${payload.flavor_notes ?? "Not provided"}\nAudience or occasion: ${payload.audience ?? "General gifting"}\nSeasonal: ${payload.seasonal ? "Yes" : "No"}`
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "product_copy",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                shortDescription: { type: "string" },
                longDescription: { type: "string" }
              },
              required: ["title", "shortDescription", "longDescription"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error("OpenAI request failed");
    }

    const result = await response.json();
    const outputText = result.output_text as string | undefined;

    if (!outputText) {
      throw new Error("OpenAI returned an empty response");
    }

    return {
      success: true,
      data: JSON.parse(outputText) as {
        title: string;
        shortDescription: string;
        longDescription: string;
      }
    };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}
