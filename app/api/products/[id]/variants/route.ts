/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getCurrentUserRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productVariantSchema } from "@/lib/validations";

function assertAdmin(role: string | null) {
  return role === "admin" || role === "staff";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
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
  const values = productVariantSchema.parse(body);
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: id,
      name: values.name,
      quantity: values.quantity,
      price: values.price,
      option_value: `${values.quantity} pcs`,
      price_delta: 0,
      stock_quantity: values.stock_quantity ?? null,
      is_default: values.is_default,
      sort_order: values.sort_order
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
