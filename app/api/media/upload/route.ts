/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { DEFAULT_BUCKET } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = (formData.get("purpose") as string | null) ?? "admin";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported." },
        { status: 400 }
      );
    }

    if (purpose === "admin") {
      const role = await getCurrentUserRole();

      if (role !== "admin" && role !== "staff") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const path = `${purpose}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
    const supabase = createAdminClient() as any;

    const { error: uploadError } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(DEFAULT_BUCKET)
      .getPublicUrl(path);

    await supabase.from("media_assets").insert({
      file_name: safeName,
      storage_path: path,
      public_url: publicUrlData.publicUrl,
      bucket: DEFAULT_BUCKET,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: null
    });

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed."
      },
      { status: 500 }
    );
  }
}
