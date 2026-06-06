/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { sanitizeUnknown } from "@/lib/security/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "product_view",
  "cart_updated",
  "checkout_started",
  "discount_modal_open",
  "link_click",
  "newsletter_signup_intent",
  "order_success",
  "push_subscribe_click"
]);

function cleanPath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.startsWith("/") ? trimmed.slice(0, 240) : null;
}

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `analytics:${context.ip}`,
      limit: 120,
      windowMs: 60 * 1000
    });

    if (rate.limited) {
      return NextResponse.json({ success: true, skipped: "rate limited" }, { status: 202 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ success: true, skipped: "analytics unavailable" });
    }

    const body = sanitizeUnknown(await request.json()) as {
      anonymous_id?: string;
      event_name?: string;
      path?: string;
      referrer?: string;
      product_id?: string | null;
      order_id?: string | null;
      cart_subtotal?: number | null;
      metadata?: Record<string, unknown>;
    };
    const eventName = typeof body.event_name === "string" ? body.event_name.trim() : "";

    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("website_events").insert({
      anonymous_id: body.anonymous_id?.trim().slice(0, 120) || null,
      user_id: user?.id ?? null,
      event_name: eventName,
      path: cleanPath(body.path),
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      product_id: body.product_id ?? null,
      order_id: body.order_id ?? null,
      cart_subtotal: Math.max(0, Number(body.cart_subtotal) || 0),
      metadata:
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? Object.fromEntries(Object.entries(body.metadata).slice(0, 20))
          : {}
    });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST204") {
        return NextResponse.json({ success: true, skipped: "website_events table not migrated yet." });
      }

      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to track event." },
      { status: 500 }
    );
  }
}
