import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subscription_id?: string;
      source?: string;
      email?: string;
    };
    const subscriptionId = body.subscription_id?.trim();

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscription id." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        subscription_id: subscriptionId,
        user_id: user?.id ?? null,
        email: body.email?.trim().toLowerCase() || user?.email || null,
        source: body.source?.trim() || "website",
        opted_in: true,
        last_seen_at: new Date().toISOString()
      },
      { onConflict: "subscription_id" }
    );

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ success: true, skipped: "push_subscriptions table not migrated yet." });
      }

      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save notification preference." },
      { status: 500 }
    );
  }
}
