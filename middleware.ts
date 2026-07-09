import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { securityHeaders } from "@/lib/security/headers";
import { checkRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIpFromHeaders, isLikelyBot } from "@/lib/security/request";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT_PATHS = new Set([
  "/api/stripe/webhook",
  "/api/marketing/automation",
  "/api/social/automation"
]);
const CASE_SENSITIVE_REDIRECTS = new Map([
  ["/collections/Cake-Pops", "/collections/cake-pops"],
  ["/collections/Cakesicles", "/collections/cakesicles"]
]);

function withSecurityHeaders(response: NextResponse) {
  for (const header of securityHeaders) {
    response.headers.set(header.key, header.value);
  }

  return response;
}

function rateLimitForPath(pathname: string) {
  if (pathname.includes("/login") || pathname.includes("/auth")) {
    return { limit: 12, windowMs: 60_000 };
  }

  if (pathname.startsWith("/api/media/upload")) {
    return { limit: 10, windowMs: 60_000 };
  }

  if (pathname.startsWith("/api/paypal") || pathname.includes("checkout")) {
    return { limit: 20, windowMs: 60_000 };
  }

  if (pathname.startsWith("/api/analytics")) {
    return { limit: 120, windowMs: 60_000 };
  }

  if (pathname.startsWith("/api")) {
    return { limit: 60, windowMs: 60_000 };
  }

  return { limit: 180, windowMs: 60_000 };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const redirectPath = CASE_SENSITIVE_REDIRECTS.get(pathname);

  if (redirectPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirectPath;

    return withSecurityHeaders(NextResponse.redirect(redirectUrl, 301));
  }

  const ip = getClientIpFromHeaders(request.headers);
  const rate = rateLimitForPath(pathname);
  const rateResult = checkRateLimit({
    key: `${ip}:${request.method}:${pathname}`,
    limit: rate.limit,
    windowMs: rate.windowMs
  });

  if (rateResult.limited) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: rateLimitHeaders(rateResult, rate.limit)
        }
      )
    );
  }

  if (
    MUTATING_METHODS.has(request.method.toUpperCase()) &&
    !CSRF_EXEMPT_PATHS.has(pathname) &&
    !assertSameOrigin(request)
  ) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
    );
  }

  if (
    MUTATING_METHODS.has(request.method.toUpperCase()) &&
    pathname.startsWith("/api/") &&
    isLikelyBot(request.headers.get("user-agent")) &&
    !pathname.startsWith("/api/analytics")
  ) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Request blocked." }, { status: 403 })
    );
  }

  try {
    return withSecurityHeaders(await updateSession(request));
  } catch {
    return withSecurityHeaders(NextResponse.next({ request }));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)"]
};
