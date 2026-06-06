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
  prepareCheckoutOrder,
  sendEmailNotificationIfConfigured
} from "@/lib/order-service";
import { getSiteSettings } from "@/lib/data/queries";
import { premiumEmailTemplates } from "@/lib/email-templates";
import { getLogoUploadFee, isLogoUploadAddOn } from "@/lib/treat-designer";
import { getErrorMessage } from "@/lib/utils";
import { logAdminAudit, logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getServerActionRequestContext } from "@/lib/security/request";
import { sanitizeUnknown } from "@/lib/security/sanitize";
import { getTurnstileToken, verifyTurnstileToken } from "@/lib/security/turnstile";
import { customOrderSchema } from "@/lib/validations";
import { treatDesignerOrderSchema } from "@/lib/validations";

export async function submitCustomOrderAction(input: unknown) {
  try {
    if (!hasSupabaseEnv()) {
      return {
        error: "Custom order requests are temporarily unavailable. Please contact us directly to place your request."
      };
    }

    const context = await getServerActionRequestContext();
    const rate = checkRateLimit({
      key: `custom-order:${context.ip}`,
      limit: 6,
      windowMs: 60 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "custom_order_rate_limited",
        reason: "Too many custom order requests from the same IP.",
        severity: "medium"
      });
      return { error: "Too many requests. Please wait and try again." };
    }

    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(input),
      expectedAction: "custom_order"
    });

    if (!turnstile.success) {
      return { error: turnstile.error ?? "Human verification failed." };
    }

    const values = customOrderSchema.parse(sanitizeUnknown(input));
    const supabase = createAdminClient() as any;

    const { data: customOrder, error } = await supabase.from("custom_orders").insert({
      ...values,
      status: values.status ?? "new",
      inspiration_image_url: values.inspiration_image_url || null,
      colors_theme: values.colors_theme || null,
      notes: values.notes || null
    }).select("id").single();

    if (error) {
      throw error;
    }

    try {
      const settings = await getSiteSettings();
      const customerEmail = premiumEmailTemplates.customOrderConfirmation({
        customerName: values.customer_name
      });
      await sendEmailNotificationIfConfigured({
        to: values.email,
        subject: "We received your custom sweet idea",
        html: customerEmail.html,
        text: customerEmail.text
      });

      if (settings.support_email) {
        const adminEmail = premiumEmailTemplates.promoCampaign({
          title: "New custom order request",
          body: `${values.customer_name} submitted a custom order request for ${values.event_type ?? "a sweet moment"}.`,
          url: `${getSiteUrl()}/admin/custom-orders/${customOrder?.id ?? ""}`
        });
        await sendEmailNotificationIfConfigured({
          to: settings.support_email,
          subject: `New custom order request from ${values.customer_name}`,
          html: adminEmail.html,
          text: adminEmail.text
        });
      }
    } catch (notificationError) {
      console.error("[custom-order:notifications]", notificationError);
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
        error: "Checkout is temporarily unavailable. Please contact us directly to complete your order."
      };
    }

    const supabase = createAdminClient() as any;
    const { user } = await requireAuthenticatedUser("/account/login?next=/checkout");
    const context = await getServerActionRequestContext();
    const rate = checkRateLimit({
      key: `checkout:${user.id}:${context.ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "checkout_rate_limited",
        reason: "Too many checkout attempts.",
        metadata: { userId: user.id },
        severity: "high"
      });
      return { error: "Too many checkout attempts. Please wait and try again." };
    }

    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(input),
      expectedAction: "checkout"
    });

    if (!turnstile.success) {
      return { error: turnstile.error ?? "Human verification failed." };
    }

    if (!user.email) {
      return {
        error: "Your account is missing an email address. Please sign in again."
      };
    }

    const preparedResult = await prepareCheckoutOrder(
      typeof input === "object" && input !== null
        ? { ...(sanitizeUnknown(input) as Record<string, unknown>), customer_email: user.email }
        : input,
      supabase
    );
    if (preparedResult.error || !preparedResult.data) {
      return {
        error: preparedResult.error ?? "Unable to prepare checkout."
      };
    }
    const prepared = preparedResult.data;

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

    await logAdminAudit({
      actorId: user.id,
      actorRole: "customer",
      action: "checkout_order_created",
      targetType: "order",
      targetId: orderId,
      metadata: {
        paymentProvider: prepared.selectedPaymentMethod.code,
        amountDueNow: prepared.amountDueNow
      }
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
      client_reference_id: orderId,
      success_url: `${getSiteUrl()}/order-success?order=${orderId}`,
      cancel_url: `${getSiteUrl()}/checkout?canceled=1`,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true
      },
      customer_creation: "if_required",
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        customer_email: prepared.values.customer_email
      },
      payment_intent_data: {
        description: `L&A Amor & Sugar deposit for ${orderNumber}`,
        receipt_email: prepared.values.customer_email,
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          customer_email: prepared.values.customer_email
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: prepared.settings.currency.toLowerCase(),
            unit_amount: Math.round(prepared.amountDueNow * 100),
            product_data: {
              name: "50% order deposit",
              description: `Reserve this order today. Remaining balance: ${prepared.settings.currency} ${prepared.remainingBalance.toFixed(2)}`
            }
          }
        }
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

export async function submitTreatDesignerOrderAction(input: unknown) {
  try {
    if (!hasSupabaseEnv()) {
      return { error: "Treat Designer requests are temporarily unavailable. Please contact us directly with your custom idea." };
    }

    const settings = await getSiteSettings();
    if (!settings.feature_settings.treat_designer_enabled) {
      return {
        error:
          settings.feature_settings.treat_designer_disabled_message ||
          "Treat Designer is temporarily paused. Please request a custom order and we will help you personally."
      };
    }

    const context = await getServerActionRequestContext();
    const rate = checkRateLimit({
      key: `treat-designer:${context.ip}`,
      limit: 8,
      windowMs: 60 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "treat_designer_rate_limited",
        reason: "Too many treat designer submissions from the same IP.",
        severity: "medium"
      });
      return { error: "Too many requests. Please wait and try again." };
    }

    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(input),
      expectedAction: "upload"
    });

    if (!turnstile.success) {
      return { error: turnstile.error ?? "Human verification failed." };
    }

    const values = treatDesignerOrderSchema.parse(sanitizeUnknown(input));
    const supabase = createAdminClient() as any;
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        "id,name,base_price,min_quantity,treat_designer_enabled,enable_sprinkles,enable_logo_upload,logo_upload_fee,option_groups(id,name,required,options(id,name,price_modifier,active)),product_images(*)"
      )
      .eq("id", values.productId)
      .eq("active", true)
      .eq("status", "active")
      .maybeSingle();

    if (productError || !product?.treat_designer_enabled) {
      return { error: "That treat is not available for custom design right now." };
    }

    if (values.quantity < Number(product.min_quantity ?? 1)) {
      return { error: `Minimum quantity is ${product.min_quantity}.` };
    }

    const optionGroups = (product.option_groups ?? []) as {
      id: string;
      name: string;
      required: boolean;
      options: { id: string; name: string; price_modifier: number; active: boolean }[];
    }[];
    const selectedOptionIds = new Set(values.selectedOptions);
    const selectedOptions = optionGroups.flatMap((group) =>
      (group.options ?? [])
        .filter((option) => option.active !== false && selectedOptionIds.has(option.id))
        .map((option) => ({
          id: option.id,
          groupId: group.id,
          groupName: group.name,
          name: option.name,
          priceModifier: Number(option.price_modifier ?? 0)
        }))
    );

    const missingRequired = optionGroups.find(
      (group) =>
        group.required &&
        !(group.options ?? []).some((option) => selectedOptionIds.has(option.id))
    );

    if (missingRequired) {
      return { error: `Please choose ${missingRequired.name}.` };
    }

    const { data: addOns } = values.addOns.length
      ? await supabase
          .from("add_ons")
          .select("id,name,price,active")
          .in("id", values.addOns)
          .eq("active", true)
      : { data: [] };
    const { data: activeAddOns } =
      values.logo?.url && product.enable_logo_upload
        ? await supabase.from("add_ons").select("name,price").eq("active", true)
        : { data: [] };
    const selectedAddOns = ((addOns ?? []) as { id: string; name: string; price: number }[])
      .filter((addon) => !(product.enable_logo_upload && isLogoUploadAddOn(addon)))
      .map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: Number(addon.price ?? 0)
      }));
    const { data: sprinkle } =
      values.sprinkles && product.enable_sprinkles
        ? await supabase
            .from("sprinkle_sets")
            .select("id,name,price_modifier,image_url,color_hex,active")
            .eq("id", values.sprinkles)
            .eq("active", true)
            .maybeSingle()
        : { data: null };
    const selectedSprinkle = sprinkle
      ? {
          id: sprinkle.id,
          name: sprinkle.name,
          priceModifier: Number(sprinkle.price_modifier ?? 0),
          imageUrl: sprinkle.image_url ?? null,
          colorHex: sprinkle.color_hex ?? null
        }
      : null;
    const logoFee =
      values.logo?.url && product.enable_logo_upload
        ? getLogoUploadFee(
            ((activeAddOns ?? []) as { name: string; price: number }[]).map((addOn) => ({
              name: addOn.name,
              price: Number(addOn.price ?? 0)
            })),
            Number(product.logo_upload_fee ?? 0)
          )
        : 0;
    const totalPrice =
      Number(product.base_price ?? 0) * values.quantity +
      selectedOptions.reduce((sum, option) => sum + option.priceModifier, 0) +
      selectedAddOns.reduce((sum, addon) => sum + addon.price, 0) +
      (selectedSprinkle?.priceModifier ?? 0) +
      logoFee;
    const designConfig = {
      ...(values.config ?? {}),
      sprinkles: selectedSprinkle,
      logo: values.logo ?? null,
      logoFee
    };

    const { error } = await supabase.from("treat_designer_orders").insert({
      product_id: values.productId,
      selected_options: selectedOptions,
      add_ons: selectedAddOns,
      quantity: values.quantity,
      custom_notes: values.customNotes?.trim() || null,
      total_price: totalPrice,
      config: designConfig,
      preview_image_url: values.previewImageUrl ?? null,
      created_at: values.createdAt ?? new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    revalidatePath("/admin/treat-designer");

    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
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
