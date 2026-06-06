/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createOrderRecord, prepareCheckoutOrder } from "@/lib/order-service";
import { createPayPalOrder, getPayPalAccessToken, hasPayPalLiveEnv } from "@/lib/paypal";
import { logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { sanitizeUnknown } from "@/lib/security/sanitize";
import { getTurnstileToken, verifyTurnstileToken } from "@/lib/security/turnstile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `paypal-create:${context.ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "paypal_create_rate_limited",
        reason: "Too many PayPal order creation attempts.",
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

    const body = await request.json();
    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(body),
      headers: request.headers,
      expectedAction: "checkout"
    });

    if (!turnstile.success) {
      return NextResponse.json({ error: turnstile.error ?? "Human verification failed." }, { status: 400 });
    }

    const authClient = await createClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Please sign in before paying with PayPal." },
        { status: 401 }
      );
    }

    const supabase = createAdminClient() as any;
    const preparedResult = await prepareCheckoutOrder(
      typeof body === "object" && body !== null
        ? { ...(sanitizeUnknown(body) as Record<string, unknown>), customer_email: user.email }
        : body,
      supabase
    );

    if (preparedResult.error || !preparedResult.data) {
      return NextResponse.json(
        { error: preparedResult.error ?? "Unable to prepare checkout." },
        { status: 400 }
      );
    }

    const prepared = preparedResult.data;

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: prepared.values.customer_name,
      phone: prepared.values.customer_phone
    });

    if (prepared.selectedPaymentMethod.code !== "paypal_live") {
      return NextResponse.json(
        { error: "PayPal is not the selected payment method." },
        { status: 400 }
      );
    }

    const orderRecord = await createOrderRecord(supabase, prepared, {
      user_id: user.id,
      order_status: "payment_pending",
      payment_status: "pending",
      payment_provider: "paypal"
    });

    const accessToken = await getPayPalAccessToken();
    const paypalOrder = (await createPayPalOrder({
      total: prepared.amountDueNow,
      orderNumber: orderRecord.orderNumber,
      localOrderId: orderRecord.orderId,
      accessToken
    })) as { id?: string };

    if (!paypalOrder.id) {
      return NextResponse.json({ error: "PayPal did not return an order id." }, { status: 500 });
    }

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("metadata")
      .eq("id", orderRecord.orderId)
      .maybeSingle();

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        paypal_order_id: paypalOrder.id,
        metadata: {
          ...(existingOrder?.metadata ?? {}),
          paypal_order_id: paypalOrder.id
        }
      })
      .eq("id", orderRecord.orderId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      id: paypalOrder.id,
      orderId: orderRecord.orderId,
      orderNumber: orderRecord.orderNumber
    });
  } catch (error) {
    console.error("[paypal-create-order]", error);
    return NextResponse.json(
      {
        error: "Unable to create PayPal order."
      },
      { status: 500 }
    );
  }
}
