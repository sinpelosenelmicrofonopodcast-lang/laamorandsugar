/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { redeemNewsletterDiscount } from "@/lib/newsletter";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `discount-redeem:${context.ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000
    });

    if (rate.limited) {
      return NextResponse.json({ error: "Too many discount attempts. Please wait and try again." }, { status: 429 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Discount redemption is temporarily unavailable." }, { status: 400 });
    }

    const body = (await request.json()) as {
      email?: string;
      discount_code?: string;
      order_id?: string | null;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const discountCode = typeof body.discount_code === "string" ? body.discount_code.trim().toUpperCase() : "";

    if (!email || !discountCode || discountCode.length > 32) {
      return NextResponse.json({ error: "Invalid discount request." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const { data: order } = body.order_id
      ? await supabase
          .from("orders")
          .select("id,customer_email,payment_status")
          .eq("id", body.order_id)
          .maybeSingle()
      : { data: null };

    if (!order || order.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Discount can only be redeemed after a paid order is confirmed." },
        { status: 400 }
      );
    }

    if ((order.customer_email ?? "").trim().toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Discount email does not match this order." },
        { status: 400 }
      );
    }

    const result = await redeemNewsletterDiscount(supabase, {
      email,
      discountCode,
      orderId: order.id
    });

    return NextResponse.json({ success: Boolean(result.success), skipped: Boolean(result.skipped) });
  } catch (error) {
    console.error("[discount-redeem]", error);
    return NextResponse.json(
      { error: "Unable to redeem discount." },
      { status: 500 }
    );
  }
}
