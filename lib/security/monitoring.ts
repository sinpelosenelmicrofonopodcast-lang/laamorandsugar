import { SECURITY } from "@/lib/security/config";

export function captureSecurityEvent(
  event: string,
  metadata: Record<string, unknown> = {}
) {
  if (SECURITY.sentryDsn || SECURITY.logRocketAppId) {
    console.info("[security-monitor]", event, metadata);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[security-monitor:dev]", event, metadata);
  }
}
