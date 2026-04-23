"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(input: unknown) {
  const values = loginSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    return {
      error: error.message
    };
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
