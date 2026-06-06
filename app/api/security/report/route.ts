import { NextResponse } from "next/server";

import { logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  const rate = checkRateLimit({
    key: `security-report:${context.ip}`,
    limit: 30,
    windowMs: 60 * 1000
  });

  if (rate.limited) {
    return NextResponse.json({ success: true }, { status: 202 });
  }

  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  await logSuspiciousActivity({
    event: "browser_security_report",
    reason: "Browser submitted a CSP or security report.",
    metadata: {
      report: body
    },
    request,
    severity: "medium"
  });

  return NextResponse.json({ success: true });
}
