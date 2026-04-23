/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUserRole() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = (await (supabase as any)
    .from("roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()) as { data: { role: string } | null };

  return data?.role ?? null;
}

export async function requireAdminAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();

  if (role !== "admin" && role !== "staff") {
    redirect("/login?error=forbidden");
  }

  return { user, role };
}
