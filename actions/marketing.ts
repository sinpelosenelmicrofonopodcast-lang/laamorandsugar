"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";

import {
  processAbandonedCartRecovery,
  processScheduledCampaigns
} from "@/lib/marketing-automation";
import { requireAdminAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getErrorMessage } from "@/lib/utils";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createMarketingCampaignAction(formData: FormData) {
  try {
    const { user } = await requireAdminAccess();
    const name = formString(formData, "name");
    const channel = formString(formData, "channel") || "email";
    const subject = formString(formData, "subject");
    const body = formString(formData, "body");
    const ctaLabel = formString(formData, "cta_label");
    const ctaUrl = formString(formData, "cta_url");
    const scheduledFor = formString(formData, "scheduled_for");

    if (!name || !body) {
      throw new Error("Campaign name and body are required.");
    }

    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("notification_campaigns").insert({
      name,
      channel,
      status: scheduledFor ? "scheduled" : "draft",
      subject: subject || name,
      body,
      cta_label: ctaLabel || "Shop now",
      cta_url: ctaUrl || "/shop",
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      created_by: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/admin/marketing");
    revalidatePath("/admin");
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function runMarketingAutomationAction() {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const [abandonedCarts, campaigns] = await Promise.all([
      processAbandonedCartRecovery(supabase),
      processScheduledCampaigns(supabase)
    ]);

    revalidatePath("/admin/marketing");
    revalidatePath("/admin");
    void abandonedCarts;
    void campaigns;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
