/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { captureSecurityEvent } from "@/lib/security/monitoring";
import { getServerActionRequestContext } from "@/lib/security/request";

type AuditInput = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  severity?: "info" | "warning" | "critical";
};

export async function logAdminAudit(input: AuditInput) {
  try {
    const context = await getServerActionRequestContext();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("admin_audit_logs").insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      metadata: input.metadata ?? {},
      ip_address: context.ip,
      user_agent: context.userAgent,
      severity: input.severity ?? "info"
    });

    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
      console.warn("[audit]", error.message);
    }
    captureSecurityEvent(input.action, {
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      severity: input.severity ?? "info"
    });
  } catch (error) {
    console.warn("[audit]", error instanceof Error ? error.message : error);
  }
}

export async function logSuspiciousActivity(input: {
  event: string;
  reason: string;
  metadata?: Record<string, unknown>;
  severity?: "low" | "medium" | "high" | "critical";
  request?: Request;
}) {
  try {
    const context = input.request
      ? {
          ip:
            input.request.headers.get("cf-connecting-ip") ??
            input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown",
          userAgent: input.request.headers.get("user-agent") ?? "unknown"
        }
      : await getServerActionRequestContext();
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("suspicious_activity_logs").insert({
      event: input.event,
      reason: input.reason,
      metadata: input.metadata ?? {},
      ip_address: context.ip,
      user_agent: context.userAgent,
      severity: input.severity ?? "medium"
    });

    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
      console.warn("[suspicious]", error.message);
    }
    captureSecurityEvent(input.event, {
      reason: input.reason,
      severity: input.severity ?? "medium"
    });
  } catch (error) {
    console.warn("[suspicious]", error instanceof Error ? error.message : error);
  }
}
