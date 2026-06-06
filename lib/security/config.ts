export const SECURITY = {
  maxJsonBodyBytes: 128 * 1024,
  maxUploadBytes: 4 * 1024 * 1024,
  allowedUploadMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedUploadExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  sentryDsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  logRocketAppId: process.env.NEXT_PUBLIC_LOGROCKET_APP_ID ?? ""
};

export type UploadMimeType = (typeof SECURITY.allowedUploadMimeTypes)[number];

export function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}
