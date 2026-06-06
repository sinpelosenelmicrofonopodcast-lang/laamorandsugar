import { NextResponse } from "next/server";

import {
  ensureSocialPostQueue,
  processDueSocialPosts,
  refreshSocialPostMetrics,
  verifySocialAutomationSecret
} from "@/lib/social-post-manager";
import { getErrorMessage } from "@/lib/utils";

function getSecretFromRequest(request: Request) {
  const url = new URL(request.url);
  return (
    request.headers.get("x-social-automation-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret")
  );
}

async function handleAutomationRequest(request: Request) {
  const secret = getSecretFromRequest(request);
  const authorized = Boolean(request.headers.get("x-vercel-cron")) || await verifySocialAutomationSecret(secret);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const daysAhead = url.searchParams.get("daysAhead");
    const includeMetrics = url.searchParams.get("metrics") === "1";
    const force = url.searchParams.get("force") === "1";
    const publishing = await processDueSocialPosts();
    let queue:
      | Awaited<ReturnType<typeof ensureSocialPostQueue>>
      | null = null;
    let queueError: string | null = null;

    try {
      queue = await ensureSocialPostQueue({
        daysAhead: daysAhead ? Number(daysAhead) : undefined,
        force
      });
    } catch (error) {
      queueError = getErrorMessage(error);
    }

    if (includeMetrics) {
      await refreshSocialPostMetrics();
    }

    return NextResponse.json({
      ok: true,
      createdCount: queue?.created.length ?? 0,
      processedCount: publishing.processed.length,
      skipped: publishing.skipped,
      queueError,
      metricsRefreshed: includeMetrics
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleAutomationRequest(request);
}

export async function POST(request: Request) {
  return handleAutomationRequest(request);
}
