import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(
    {
      resource: "https://amorandsugarla.com/api/chatgpt-mcp",
      authorization_servers: ["https://vbrkhekumwksyvnznnnz.supabase.co/auth/v1"],
      scopes_supported: ["openid", "email", "profile"],
      bearer_methods_supported: ["header"]
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
