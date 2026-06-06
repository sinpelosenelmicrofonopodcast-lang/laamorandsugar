"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { absoluteUrl, getErrorMessage } from "@/lib/utils";
import { logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getServerActionRequestContext } from "@/lib/security/request";
import { getTurnstileToken, verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  forgotPasswordSchema,
  loginSchema
} from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

async function getRequestOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (origin?.startsWith("http://") || origin?.startsWith("https://")) {
    return origin.replace(/\/$/, "");
  }

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");

  if (!host) {
    return null;
  }

  const protocol = headersList.get("x-forwarded-proto") ?? "https";

  return `${protocol}://${host}`.replace(/\/$/, "");
}

export async function signInAction(input: unknown) {
  const context = await getServerActionRequestContext();
  const rate = checkRateLimit({
    key: `login:${context.ip}`,
    limit: 8,
    windowMs: 15 * 60 * 1000
  });

  if (rate.limited) {
    await logSuspiciousActivity({
      event: "login_rate_limited",
      reason: "Too many login attempts from the same IP.",
      metadata: { ip: context.ip },
      severity: "high"
    });
    return { error: "Too many sign-in attempts. Please wait and try again." };
  }

  const turnstile = await verifyTurnstileToken({
    token: getTurnstileToken(input),
    expectedAction: "admin_login"
  });

  if (!turnstile.success) {
    await logSuspiciousActivity({
      event: "turnstile_failed",
      reason: turnstile.error ?? "Login verification failed.",
      severity: "medium"
    });
    return { error: turnstile.error ?? "Human verification failed." };
  }

  const values = loginSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    await logSuspiciousActivity({
      event: "login_failed",
      reason: "Supabase rejected login credentials.",
      metadata: { email: values.email },
      severity: "medium"
    });
    return {
      error: "Invalid email or password."
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
    const context = await getServerActionRequestContext();
    const rate = checkRateLimit({
      key: `password-reset:${context.ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "password_reset_rate_limited",
        reason: "Too many password reset attempts from the same IP.",
        severity: "medium"
      });
      return { error: "Too many reset attempts. Please wait and try again." };
    }

    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(input),
      expectedAction: "password_reset"
    });

    if (!turnstile.success) {
      return { error: turnstile.error ?? "Human verification failed." };
    }

    const values = forgotPasswordSchema.parse(input);
    const supabase = await createClient();
    const requestOrigin = await getRequestOrigin();

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${requestOrigin ?? absoluteUrl()}/auth/callback?next=/reset-password`
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
