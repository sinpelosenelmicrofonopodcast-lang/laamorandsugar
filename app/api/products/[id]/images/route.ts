/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productImageSchema } from "@/lib/validations";

function assertAdmin(role: string | null) {
  return role === "admin" || role === "staff";
}

async function insertImage(supabase: any, payload: {
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}) {
  const { data, error } = await supabase
    .from("product_images")
    .insert(payload)
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
    return await supabase
      .from("product_images")
      .insert({
        product_id: payload.product_id,
        url: payload.image_url,
        alt_text: payload.alt_text,
        is_primary: payload.is_primary,
        sort_order: payload.sort_order
      })
      .select("*")
      .single();
  }

  return { data: null, error };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole();
  if (!assertAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const values = productImageSchema.parse(body);
  const supabase = createAdminClient() as any;

  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if (values.is_primary) {
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", id);
  }

  const { data, error } = await insertImage(supabase, {
    product_id: id,
    image_url: values.image_url,
    alt_text: values.alt_text ?? null,
    is_primary: values.is_primary || (count ?? 0) === 0,
    sort_order: values.sort_order
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
