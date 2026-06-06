import { randomUUID } from "crypto";

import { SECURITY, isProduction } from "@/lib/security/config";
import { getClientIpFromHeaders } from "@/lib/security/request";

type TurnstileResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export function getTurnstileToken(input: unknown) {
  if (!input || typeof input !== "object") {
    return "";
  }

  const record = input as Record<string, unknown>;
  const value = record.turnstileToken ?? record.turnstile_token ?? record["cf-turnstile-response"];

  return typeof value === "string" ? value : "";
}

export async function verifyTurnstileToken(input: {
  token: string;
  headers?: Headers;
  expectedAction?: string;
}) {
  if (!SECURITY.turnstileSecretKey) {
    return {
      success: !isProduction(),
      skipped: true,
      error: isProduction()
        ? "Human verification is not configured."
        : null
    };
  }

  if (!input.token || input.token.length > 2048) {
    return { success: false, skipped: false, error: "Human verification failed." };
  }

  const body = new FormData();
  body.append("secret", SECURITY.turnstileSecretKey);
  body.append("response", input.token);
  body.append("idempotency_key", randomUUID());

  if (input.headers) {
    body.append("remoteip", getClientIpFromHeaders(input.headers));
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000)
    });
    const result = (await response.json()) as TurnstileResponse;

    if (!result.success) {
      return {
        success: false,
        skipped: false,
        error: "Human verification failed.",
        codes: result["error-codes"] ?? []
      };
    }

    if (input.expectedAction && result.action && result.action !== input.expectedAction) {
      return {
        success: false,
        skipped: false,
        error: "Human verification action mismatch."
      };
    }

    return { success: true, skipped: false, data: result };
  } catch {
    return { success: false, skipped: false, error: "Human verification is temporarily unavailable." };
  }
}
