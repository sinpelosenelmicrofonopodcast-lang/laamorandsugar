import { NextResponse } from "next/server";

import {
  processAbandonedCartRecovery,
  processScheduledCampaigns
} from "@/lib/marketing-automation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  if (request.headers.get("x-vercel-cron")) {
    return true;
  }

  const expected = process.env.MARKETING_AUTOMATION_TOKEN || process.env.CRON_SECRET;

  if (!expected) {
    return true;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token === expected;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ success: true, skipped: "Supabase not configured." });
    }

    const supabase = createAdminClient();
    const [abandonedCarts, campaigns] = await Promise.all([
      processAbandonedCartRecovery(supabase),
      processScheduledCampaigns(supabase)
    ]);

    return NextResponse.json({
      success: true,
      abandonedCarts,
      campaigns
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marketing automation failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
