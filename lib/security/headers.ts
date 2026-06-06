const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev ? "'unsafe-eval'" : null,
  "https://challenges.cloudflare.com",
  "https://www.paypal.com",
  "https://www.paypalobjects.com",
  "https://js.stripe.com",
  "https://onesignal.com",
  "https://cdn.onesignal.com",
  "https://embed.tawk.to",
  "https://cdn.jsdelivr.net"
].filter(Boolean);

const styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];

const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://api.stripe.com",
  "https://js.stripe.com",
  "https://www.paypal.com",
  "https://api-m.paypal.com",
  "https://api-m.sandbox.paypal.com",
  "https://challenges.cloudflare.com",
  "https://onesignal.com",
  "https://*.onesignal.com",
  "https://*.tawk.to",
  "wss://*.tawk.to",
  "https://*.ingest.sentry.io",
  "https://*.logrocket.io",
  "https://*.lr-ingest.io"
];

export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  `style-src ${styleSrc.join(" ")}`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src ${connectSrc.join(" ")}`,
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://*.tawk.to",
  "worker-src 'self' blob:",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  "report-uri /api/security/report"
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(self), picture-in-picture=(), publickey-credentials-get=(self), screen-wake-lock=(), usb=(), web-share=(self), browsing-topics=()"
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" }
];
