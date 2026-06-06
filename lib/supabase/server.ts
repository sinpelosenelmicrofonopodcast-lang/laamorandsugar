import { cookies } from "next/headers";
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

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, secureCookieOptions(options) as never)
          );
        } catch {
          // Cookie updates are not available from some server contexts.
        }
      }
    }
  });
}
