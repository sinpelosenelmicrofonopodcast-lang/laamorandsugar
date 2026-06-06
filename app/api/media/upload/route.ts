/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { DEFAULT_BUCKET } from "@/lib/constants";
import { logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import {
  buildUploadPath,
  detectImageMime,
  sanitizeFileName,
  validateImageUpload
} from "@/lib/security/uploads";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
function normalizeUploadPurpose(value: string) {
  const cleaned = value.replace(/[^a-z0-9/_-]/gi, "-").slice(0, 80) || "admin";

  if (cleaned === "custom-order" || cleaned === "order-message") {
    return cleaned;
  }

  if (cleaned.startsWith("treat-designer")) {
    return cleaned;
  }

  if (cleaned === "admin" || cleaned.startsWith("admin/")) {
    return cleaned;
  }

  return "admin";
}

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `upload:${context.ip}`,
      limit: 10,
      windowMs: 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "upload_rate_limited",
        reason: "Too many upload attempts.",
        request,
        severity: "high"
      });
      return NextResponse.json({ error: "Too many uploads. Please wait and try again." }, { status: 429 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Uploads are temporarily unavailable." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedPurpose = ((formData.get("purpose") as string | null) ?? "admin").trim();
    const purpose = normalizeUploadPurpose(requestedPurpose);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const uploadValidation = validateImageUpload(file);
    if (!uploadValidation.valid) {
      await logSuspiciousActivity({
        event: "upload_validation_failed",
        reason: uploadValidation.error ?? "Invalid upload.",
        metadata: { fileName: file.name, mimeType: file.type, size: file.size, purpose },
        request,
        severity: "medium"
      });
      return NextResponse.json({ error: uploadValidation.error }, { status: 400 });
    }

    if (purpose === "admin" || purpose.startsWith("admin/")) {
      const role = await getCurrentUserRole();

      if (role !== "admin" && role !== "staff") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    } else {
      const turnstile = await verifyTurnstileToken({
        token: (formData.get("turnstileToken") as string | null) ?? "",
        headers: request.headers,
        expectedAction: purpose === "custom-order" ? "custom_order" : "upload"
      });

      if (!turnstile.success) {
        await logSuspiciousActivity({
          event: "upload_turnstile_failed",
          reason: turnstile.error ?? "Upload verification failed.",
          request,
          severity: "medium"
        });
        return NextResponse.json({ error: turnstile.error ?? "Human verification failed." }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectImageMime(buffer);

    if (!detectedMime || detectedMime !== file.type.toLowerCase()) {
      await logSuspiciousActivity({
        event: "upload_mime_mismatch",
        reason: "Uploaded file MIME type did not match file signature.",
        metadata: { declaredMime: file.type, detectedMime, fileName: file.name, purpose },
        request,
        severity: "high"
      });
      return NextResponse.json({ error: "Uploaded image type could not be verified." }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name);
    const path = buildUploadPath({ purpose, fileName: safeName });
    const supabase = createAdminClient() as any;

    const { error: uploadError } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .upload(path, buffer, {
        contentType: detectedMime,
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
      mime_type: detectedMime,
      size_bytes: file.size,
      alt_text: null
    });

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("[media-upload]", error);
    return NextResponse.json(
      {
        error: "Upload failed."
      },
      { status: 500 }
    );
  }
}
