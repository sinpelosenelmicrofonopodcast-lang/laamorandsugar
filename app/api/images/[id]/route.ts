/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productImageSchema } from "@/lib/validations";

function assertAdmin(role: string | null) {
  return role === "admin" || role === "staff";
}

async function updateImageRecord(
  supabase: any,
  id: string,
  values: {
    image_url?: string;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
  }
) {
  const imagePayload = {
    ...(values.image_url !== undefined ? { image_url: values.image_url } : {}),
    ...(values.alt_text !== undefined ? { alt_text: values.alt_text ?? null } : {}),
    ...(values.is_primary !== undefined ? { is_primary: values.is_primary } : {}),
    ...(values.sort_order !== undefined ? { sort_order: values.sort_order } : {})
  };

  const { data, error } = await supabase
    .from("product_images")
    .update(imagePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (!error) {
    return { data, error: null };
  }

  if (
    error.code === "PGRST204" &&
    typeof error.message === "string" &&
    error.message.includes("'image_url'")
  ) {
    const legacyPayload = {
      ...(values.image_url !== undefined ? { url: values.image_url } : {}),
      ...(values.alt_text !== undefined ? { alt_text: values.alt_text ?? null } : {}),
      ...(values.is_primary !== undefined ? { is_primary: values.is_primary } : {}),
      ...(values.sort_order !== undefined ? { sort_order: values.sort_order } : {})
    };

    return await supabase
      .from("product_images")
      .update(legacyPayload)
      .eq("id", id)
      .select("*")
      .single();
  }

  return { data: null, error };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole();
  if (!assertAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const values = productImageSchema.partial().parse(body);
  const supabase = createAdminClient() as any;

  const { data: existing } = await supabase
    .from("product_images")
    .select("product_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (values.is_primary) {
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", existing.product_id);
  }

  const { data, error } = await updateImageRecord(supabase, id, values);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole();
  if (!assertAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createAdminClient() as any;
  const { data: existing } = await supabase
    .from("product_images")
    .select("id,product_id,is_primary")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", existing.product_id);

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "A product must keep at least 1 image." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("product_images").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (existing.is_primary) {
    const { data: nextImage } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", existing.product_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImage?.id) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", nextImage.id);
    }
  }

  return NextResponse.json({ success: true });
}
