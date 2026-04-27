/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createOrderRecord, prepareCheckoutOrder } from "@/lib/order-service";
import { createPayPalOrder, getPayPalAccessToken, hasPayPalLiveEnv } from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 400 });
    }

    if (!hasPayPalLiveEnv()) {
      return NextResponse.json({ error: "PayPal is not configured yet." }, { status: 400 });
    }

    const body = await request.json();
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
    const preparedResult = await prepareCheckoutOrder(body, supabase);

    if (preparedResult.error || !preparedResult.data) {
      return NextResponse.json(
        { error: preparedResult.error ?? "Unable to prepare checkout." },
        { status: 400 }
      );
    }

    const prepared = preparedResult.data;
    prepared.values.customer_email = user.email;

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
      total: prepared.total,
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create PayPal order."
      },
      { status: 500 }
    );
  }
}
