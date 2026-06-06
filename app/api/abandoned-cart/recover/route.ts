/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cartItemSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Cart recovery is temporarily unavailable." }, { status: 400 });
    }

    const token = new URL(request.url).searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json({ error: "Missing recovery token." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from("abandoned_carts")
      .select("id,items,status")
      .eq("recovery_token", token)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST204") {
        return NextResponse.json({ error: "Cart recovery is not migrated yet." }, { status: 400 });
      }

      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Recovery link not found." }, { status: 404 });
    }

    const items: Array<z.infer<typeof cartItemSchema>> = [];

    if (Array.isArray(data.items)) {
      for (const item of data.items as unknown[]) {
        const result = cartItemSchema.safeParse(item);

        if (result.success) {
          items.push(result.data);
        }
      }
    }

    await supabase
      .from("abandoned_carts")
      .update({
        status: data.status === "open" ? "recovered" : data.status,
        metadata: { recovered_at: new Date().toISOString() }
      })
      .eq("id", data.id);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to recover cart." },
      { status: 500 }
    );
  }
}
