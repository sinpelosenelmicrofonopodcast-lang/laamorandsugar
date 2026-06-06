import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { isProduction } from "@/lib/security/config";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function secureCookieOptions(options?: Record<string, unknown>) {
  return {
    ...options,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/"
  };
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, secureCookieOptions(options) as never)
          );
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}
