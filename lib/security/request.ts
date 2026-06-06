import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export function getClientIpFromHeaders(input: Headers) {
  return (
    input.get("cf-connecting-ip") ??
    input.get("true-client-ip") ??
    input.get("x-real-ip") ??
    input.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function getServerActionRequestContext() {
  const list = await headers();

  return {
    ip: getClientIpFromHeaders(list),
    userAgent: list.get("user-agent") ?? "unknown",
    origin: list.get("origin") ?? null,
    host: list.get("x-forwarded-host") ?? list.get("host") ?? null
  };
}

export function getRequestContext(request: Request | NextRequest) {
  return {
    ip: getClientIpFromHeaders(request.headers),
    userAgent: request.headers.get("user-agent") ?? "unknown",
    origin: request.headers.get("origin"),
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  };
}

export function assertSameOrigin(request: Request | NextRequest) {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function isLikelyBot(userAgent: string | null) {
  const value = (userAgent ?? "").toLowerCase();

  if (!value) {
    return true;
  }

  return /curl|wget|python-requests|httpclient|libwww|scrapy|spider|crawler|headlesschrome|phantomjs|selenium|bytespider|semrush|ahrefs|mj12bot/.test(
    value
  );
}
