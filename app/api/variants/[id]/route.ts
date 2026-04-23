/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productVariantSchema } from "@/lib/validations";

function assertAdmin(role: string | null) {
  return role === "admin" || role === "staff";
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
  const values = productVariantSchema.partial().parse(body);
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("product_variants")
    .update({
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.quantity !== undefined ? { quantity: values.quantity, option_value: `${values.quantity} pcs` } : {}),
      ...(values.price !== undefined ? { price: values.price } : {}),
      ...(values.stock_quantity !== undefined ? { stock_quantity: values.stock_quantity ?? null } : {}),
      ...(values.is_default !== undefined ? { is_default: values.is_default } : {}),
      ...(values.sort_order !== undefined ? { sort_order: values.sort_order } : {})
    })
    .eq("id", id)
    .select("*")
    .single();

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
  const { error } = await supabase.from("product_variants").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
