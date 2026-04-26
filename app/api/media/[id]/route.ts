/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
    }

    const role = await getCurrentUserRole();

    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient() as any;

    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("id, bucket, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (assetError) {
      throw assetError;
    }

    if (!asset) {
      return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
    }

    const { error: storageError } = await supabase.storage
      .from(asset.bucket)
      .remove([asset.storage_path]);

    if (storageError) {
      throw storageError;
    }

    const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete media asset."
      },
      { status: 500 }
    );
  }
}
