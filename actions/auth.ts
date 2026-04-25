"use server";

import { redirect } from "next/navigation";

import { absoluteUrl, getErrorMessage } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema
} from "@/lib/validations";
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

export async function requestPasswordResetAction(input: unknown) {
  try {
    const values = forgotPasswordSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: absoluteUrl("/reset-password")
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      message:
        "If that email exists in the system, we sent a password reset link."
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
