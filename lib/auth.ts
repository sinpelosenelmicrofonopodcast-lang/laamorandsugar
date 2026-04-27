/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Route } from "next";
import { redirect } from "next/navigation";

import type { ProfileRow } from "@/lib/types/app";
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

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = (await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()) as { data: ProfileRow | null };

  return data;
}

export async function requireAuthenticatedUser(redirectTo = "/account/login") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(redirectTo as Route);
  }

  const [profile, role] = await Promise.all([getCurrentProfile(), getCurrentUserRole()]);

  return {
    user,
    profile,
    role
  };
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
