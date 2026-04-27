"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";

import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getStripe } from "@/lib/stripe";
import {
  createOrderRecord,
  getSiteUrl,
  prepareCheckoutOrder
} from "@/lib/order-service";
import { getErrorMessage } from "@/lib/utils";
import { customOrderSchema } from "@/lib/validations";

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

    const supabase = createAdminClient() as any;
    const preparedResult = await prepareCheckoutOrder(input, supabase);
    if (preparedResult.error || !preparedResult.data) {
      return {
        error: preparedResult.error ?? "Unable to prepare checkout."
      };
    }
    const prepared = preparedResult.data;
    const { user } = await requireAuthenticatedUser("/account/login?next=/checkout");

    if (!user.email) {
      return {
        error: "Your account is missing an email address. Please sign in again."
      };
    }

    prepared.values.customer_email = user.email;

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: prepared.values.customer_name,
      phone: prepared.values.customer_phone
    });

    if (prepared.selectedPaymentMethod.kind === "paypal_live") {
      return {
        error: "Use the PayPal button below to complete this payment."
      };
    }

    const { orderId, orderNumber } = await createOrderRecord(supabase, prepared, {
      user_id: user.id,
      order_status:
        prepared.selectedPaymentMethod.kind === "manual" ? "payment_pending" : "pending_review",
      payment_status: "pending",
      payment_provider:
        prepared.selectedPaymentMethod.code === "stripe" ? "stripe" : "manual"
    });

    if (prepared.selectedPaymentMethod.kind === "manual") {
      return {
        success: true,
        url: `${getSiteUrl()}/order-success?order=${orderId}`
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        error: "Stripe is not configured yet."
      };
    }

    const stripe = getStripe();
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("metadata")
      .eq("id", orderId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: prepared.values.customer_email,
      success_url: `${getSiteUrl()}/order-success?order=${orderId}`,
      cancel_url: `${getSiteUrl()}/checkout?canceled=1`,
      payment_method_types: ["card"],
      metadata: {
        order_id: orderId,
        order_number: orderNumber
      },
      line_items: [
        ...prepared.stripeLineItems,
        ...(prepared.deliveryFee > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: prepared.settings.currency.toLowerCase(),
                  unit_amount: Math.round(prepared.deliveryFee * 100),
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
        stripe_checkout_session_id: session.id,
        metadata: {
          ...(existingOrder?.metadata ?? {}),
          stripe_checkout_session_id: session.id
        }
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
              "You write polished dessert product copy for a premium feminine brand. Return strict JSON with keys title, shortDescription, longDescription."
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
