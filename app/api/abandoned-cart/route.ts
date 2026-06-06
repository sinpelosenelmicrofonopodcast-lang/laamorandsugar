import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { sanitizeUnknown } from "@/lib/security/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { cartItemSchema } from "@/lib/validations";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `abandoned-cart:${context.ip}`,
      limit: 60,
      windowMs: 60 * 1000
    });

    if (rate.limited) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = sanitizeUnknown(await request.json()) as {
      anonymous_id?: string;
      email?: string;
      items?: unknown[];
      subtotal?: number;
    };
    const anonymousId = body.anonymous_id?.trim().slice(0, 120);

    if (!anonymousId) {
      return NextResponse.json({ error: "Missing anonymous cart id." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const items = Array.isArray(body.items)
      ? body.items
          .flatMap((item) => {
            const parsed = cartItemSchema.safeParse(item);
            return parsed.success ? [parsed.data] : [];
          })
          .slice(0, 50)
      : [];
    const supabase = createAdminClient() as any;
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id,status")
      .eq("anonymous_id", anonymousId)
      .in("status", ["open", "emailed", "push_sent"])
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const payload = {
      anonymous_id: anonymousId,
      user_id: user?.id ?? null,
      email: body.email?.trim().toLowerCase() || user?.email || null,
      items,
      subtotal: Math.max(0, Number(body.subtotal) || 0),
      last_seen_at: new Date().toISOString(),
      status: existing?.status ?? "open"
    };
    const query = existing
      ? supabase.from("abandoned_carts").update(payload).eq("id", existing.id)
      : supabase.from("abandoned_carts").insert(payload);
    const { error } = await query;

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ success: true, skipped: "abandoned_carts table not migrated yet." });
      }

      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save abandoned cart." },
      { status: 500 }
    );
  }
}
