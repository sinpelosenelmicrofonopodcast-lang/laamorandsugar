/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { validateNewsletterDiscount } from "@/lib/newsletter";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `discount-validate:${context.ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000
    });

    if (rate.limited) {
      return NextResponse.json({ error: "Too many discount attempts. Please wait and try again." }, { status: 429 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Discount validation is temporarily unavailable." }, { status: 400 });
    }

    const body = (await request.json()) as {
      email?: string;
      discount_code?: string;
      cart_subtotal?: number;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const discountCode = typeof body.discount_code === "string" ? body.discount_code.trim().toUpperCase() : "";

    if (!email || !discountCode || discountCode.length > 32) {
      return NextResponse.json({ error: "Invalid discount request." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const result = await validateNewsletterDiscount(supabase, {
      email,
      discountCode,
      cartSubtotal: Number(body.cart_subtotal ?? 0)
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discount_percent: result.discountPercent,
      discount_amount: result.discountAmount,
      new_total: result.newTotal
    });
  } catch (error) {
    console.error("[discount-validate]", error);
    return NextResponse.json(
      { error: "Unable to validate discount." },
      { status: 500 }
    );
  }
}
