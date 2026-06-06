import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code) {
    redirectUrl.pathname = "/reset-password";
    redirectUrl.searchParams.set("error", "invalid-reset-link");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = "/reset-password";
    redirectUrl.searchParams.set("error", "invalid-reset-link");
    return NextResponse.redirect(redirectUrl);
  }

  if (redirectUrl.pathname === "/reset-password") {
    redirectUrl.searchParams.set("recovery", "1");
  }

  return NextResponse.redirect(redirectUrl);
}
