/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  createOrderMessage,
  ensureOrderStatusHistory,
  getSiteUrl,
  notifyCustomerAboutOrderUpdate,
  redeemOrderNewsletterDiscount
} from "@/lib/order-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { capturePayPalOrder, getPayPalAccessToken, hasPayPalLiveEnv } from "@/lib/paypal";
import { logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `paypal-capture:${context.ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "paypal_capture_rate_limited",
        reason: "Too many PayPal capture attempts.",
        request,
        severity: "high"
      });
      return NextResponse.json({ error: "Too many checkout attempts. Please wait and try again." }, { status: 429 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 400 });
    }

    if (!hasPayPalLiveEnv()) {
      return NextResponse.json({ error: "PayPal is not configured yet." }, { status: 400 });
    }

    const body = (await request.json()) as { orderID?: string };
    const paypalOrderId = body.orderID;

    if (!paypalOrderId) {
      return NextResponse.json({ error: "Missing PayPal order id." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const authClient = await createClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("paypal_order_id", paypalOrderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found for this PayPal payment." }, { status: 404 });
    }

    if (order.user_id && (!user || user.id !== order.user_id)) {
      return NextResponse.json(
        { error: "Please sign in to the account that created this order." },
        { status: 401 }
      );
    }

    if (order.payment_status === "paid" && order.paypal_capture_id) {
      return NextResponse.json({
        success: true,
        redirectUrl: `${getSiteUrl()}/order-success?order=${order.id}`
      });
    }

    const accessToken = await getPayPalAccessToken();
    const capture = (await capturePayPalOrder({
      paypalOrderId,
      orderNumber: order.order_number,
      accessToken
    })) as {
      status?: string;
      payer?: {
        email_address?: string;
        name?: { given_name?: string; surname?: string };
      };
      purchase_units?: {
        payments?: {
          captures?: {
            id?: string;
            status?: string;
          }[];
        };
      }[];
    };

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PayPal payment was not completed." },
        { status: 400 }
      );
    }

    const captureId =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    const existingMetadata =
      order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
        ? order.metadata
        : {};

    const updatePayload = {
      status: "confirmed",
      order_status: "paid",
      payment_provider: "paypal",
      payment_status: "paid",
      paypal_capture_id: captureId,
      paid_at: new Date().toISOString(),
      payment_response: capture,
      metadata: {
        ...existingMetadata,
        payer_email: capture.payer?.email_address ?? null,
        payer_name:
          [capture.payer?.name?.given_name, capture.payer?.name?.surname].filter(Boolean).join(" ") ||
          null
      }
    };

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    await redeemOrderNewsletterDiscount(supabase, {
      ...order,
      ...updatePayload
    });

    await ensureOrderStatusHistory(supabase, {
      orderId: order.id,
      oldStatus: order.order_status ?? "payment_pending",
      newStatus: "paid",
      note: "We received your 50% deposit and your order is confirmed.",
      changedBy: "system",
      customerVisible: true
    });

    await createOrderMessage(supabase, {
      orderId: order.id,
      senderType: "system",
      senderName: "L&A Amor & Sugar",
      messageBody: "We received your 50% deposit and your order is confirmed.",
      isRead: false
    });

    await notifyCustomerAboutOrderUpdate(
      supabase,
      {
        ...order,
        ...updatePayload
      },
      {
        notificationType: "payment_received",
        message: "We received your 50% deposit and your order is confirmed.",
        status: "paid"
      }
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(`/order-status/${order.order_access_token}`);

    return NextResponse.json({
      success: true,
      redirectUrl: `${getSiteUrl()}/order-success?order=${order.id}`
    });
  } catch (error) {
    console.error("[paypal-capture-order]", error);
    return NextResponse.json(
      {
        error: "Unable to capture PayPal payment."
      },
      { status: 500 }
    );
  }
}
