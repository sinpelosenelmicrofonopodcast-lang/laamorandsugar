"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, requireAdminAccess } from "@/lib/auth";
import {
  createManualSocialDraft,
  ensureSocialPostQueue,
  getSocialAutomationDiagnostics,
  processDueSocialPosts,
  publishSocialPostById,
  refreshSocialPostMetrics
} from "@/lib/social-post-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { getErrorMessage } from "@/lib/utils";
import {
  socialPostIdSchema,
  socialPostSchema,
  socialPostSettingsSchema
} from "@/lib/validations";

function normalizeOptionalString(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function revalidateSocialPostPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/social-posts");
}

export async function upsertSocialPostSettingsAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = socialPostSettingsSchema.parse(input);
    const supabase = createAdminClient() as any;
    const { data: existing } = await supabase
      .from("social_post_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      automation_enabled: values.automation_enabled,
      timezone: values.timezone.trim(),
      queue_days_ahead: values.queue_days_ahead,
      schedule_entries: values.schedule_entries.map((entry) => ({
        id: entry.id.trim(),
        label: entry.label.trim(),
        time: entry.time,
        enabled: entry.enabled,
        platforms: entry.platforms
      })),
      required_lines: values.required_lines.map((line) => line.trim()),
      cta_phrases_en: values.cta_phrases_en.map((line) => line.trim()),
      cta_phrases_es: values.cta_phrases_es.map((line) => line.trim()),
      default_hashtags: values.default_hashtags.map((line) => line.replace(/^#/, "").trim()),
      hashtags_enabled: values.hashtags_enabled,
      tone_notes: normalizeOptionalString(values.tone_notes)
    };

    const query = existing?.id
      ? supabase.from("social_post_settings").update(payload).eq("id", existing.id)
      : supabase.from("social_post_settings").insert(payload);
    const { error } = await query;

    if (error) {
      throw error;
    }

    revalidateSocialPostPaths();
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateSocialPostAction(input: unknown) {
  try {
    await requireAdminAccess();
    const values = socialPostSchema.extend({ id: socialPostIdSchema.shape.postId }).parse(input);
    const supabase = createAdminClient() as any;
    const payload = {
      scheduled_for: normalizeOptionalString(values.scheduled_for),
      status: values.status ?? (values.scheduled_for ? "scheduled" : "draft"),
      platforms: values.platforms,
      image_url: values.image_url.trim(),
      product_name: values.product_name.trim(),
      product_price: values.product_price ?? null,
      product_description: normalizeOptionalString(values.product_description),
      caption_en: values.caption_en.trim(),
      caption_es: values.caption_es.trim(),
      cta_en: normalizeOptionalString(values.cta_en),
      cta_es: normalizeOptionalString(values.cta_es),
      combined_caption: values.combined_caption.trim(),
      hashtags: values.hashtags.map((tag) => tag.replace(/^#/, "").trim()),
      last_error: null
    };

    const { error } = await supabase.from("social_posts").update(payload).eq("id", values.id);

    if (error) {
      throw error;
    }

    const publicationRows = values.platforms.map((platform) => ({
      social_post_id: values.id,
      platform,
      status: "pending"
    }));
    await supabase
      .from("social_post_publications")
      .upsert(publicationRows, { onConflict: "social_post_id,platform" });

    revalidateSocialPostPaths();
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteSocialPostAction(postId: string) {
  try {
    await requireAdminAccess();
    const values = socialPostIdSchema.parse({ postId });
    const supabase = createAdminClient() as any;
    const { error } = await supabase.from("social_posts").delete().eq("id", values.postId);

    if (error) {
      throw error;
    }

    revalidateSocialPostPaths();
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function cancelSocialPostAction(postId: string) {
  try {
    await requireAdminAccess();
    const values = socialPostIdSchema.parse({ postId });
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("social_posts")
      .update({
        status: "canceled",
        last_error: null
      })
      .eq("id", values.postId);

    if (error) {
      throw error;
    }

    revalidateSocialPostPaths();
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function generateSocialQueueAction(options?: { force?: boolean; daysAhead?: number }) {
  try {
    await requireAdminAccess();
    const user = await getCurrentUser();
    const result = await ensureSocialPostQueue({
      force: options?.force,
      daysAhead: options?.daysAhead,
      createdBy: user?.id ?? null
    });

    revalidateSocialPostPaths();
    return {
      success: true,
      createdCount: result.created.length
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createManualSocialDraftAction() {
  try {
    await requireAdminAccess();
    const user = await getCurrentUser();
    const post = await createManualSocialDraft(user?.id ?? null);

    revalidateSocialPostPaths();
    return {
      success: true,
      postId: post.id
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function publishSocialPostNowAction(postId: string) {
  try {
    await requireAdminAccess();
    const values = socialPostIdSchema.parse({ postId });
    const result = await publishSocialPostById(values.postId);

    revalidateSocialPostPaths();
    return {
      success: true,
      failures: result.results.filter((item) => item.status === "failed").length
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function runSocialAutomationNowAction() {
  try {
    await requireAdminAccess();
    const publishResult = await processDueSocialPosts();
    let queueResult: Awaited<ReturnType<typeof ensureSocialPostQueue>> | null = null;
    let queueError: string | null = null;

    try {
      queueResult = await ensureSocialPostQueue();
    } catch (error) {
      queueError = getErrorMessage(error);
    }

    revalidateSocialPostPaths();
    return {
      success: true,
      createdCount: queueResult?.created.length ?? 0,
      processedCount: publishResult.processed.length,
      skipped: publishResult.skipped,
      queueError
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function getSocialAutomationDiagnosticsAction() {
  try {
    await requireAdminAccess();
    return {
      success: true,
      diagnostics: await getSocialAutomationDiagnostics()
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function refreshSocialMetricsAction(postId?: string) {
  try {
    await requireAdminAccess();
    const updated = await refreshSocialPostMetrics(postId);

    revalidateSocialPostPaths();
    return {
      success: true,
      updatedCount: updated.length
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
