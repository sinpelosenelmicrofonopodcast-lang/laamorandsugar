/* eslint-disable @typescript-eslint/no-explicit-any */
import { premiumEmailTemplates } from "@/lib/email-templates";
import { sendEmailNotificationIfConfigured } from "@/lib/order-service";
import { absoluteUrl } from "@/lib/utils";

function hoursAgo(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

async function logEmailEvent(
  supabase: any,
  input: {
    email: string;
    templateKey: string;
    subject: string;
    status: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("email_events").insert({
    email: input.email,
    template_key: input.templateKey,
    subject: input.subject,
    status: input.status,
    metadata: input.metadata ?? {}
  });

  if (error && !["42P01", "PGRST205", "PGRST204"].includes(error.code)) {
    throw error;
  }
}

export async function processAbandonedCartRecovery(supabase: any) {
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("id,email,recovery_token,subtotal,last_seen_at,email_sent_at,status")
    .not("email", "is", null)
    .is("email_sent_at", null)
    .eq("status", "open")
    .lte("last_seen_at", hoursAgo(1))
    .order("last_seen_at", { ascending: true })
    .limit(25);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST204") {
      return { processed: 0, skipped: "abandoned_carts table missing" };
    }

    throw error;
  }

  let processed = 0;

  for (const cart of data ?? []) {
    const cartUrl = absoluteUrl(`/cart?recover=${cart.recovery_token}`);
    const email = premiumEmailTemplates.abandonedCart({ cartUrl });
    const subject = "You left something sweet behind";
    const result = await sendEmailNotificationIfConfigured({
      to: cart.email,
      subject,
      html: email.html,
      text: email.text
    });

    await logEmailEvent(supabase, {
      email: cart.email,
      templateKey: "abandoned_cart",
      subject,
      status: result.status,
      metadata: {
        abandoned_cart_id: cart.id,
        subtotal: cart.subtotal
      }
    }).catch(() => null);

    await supabase
      .from("abandoned_carts")
      .update({
        status: result.status === "sent" ? "emailed" : "open",
        email_sent_at: result.status === "sent" ? new Date().toISOString() : null,
        metadata: {
          last_recovery_status: result.status
        }
      })
      .eq("id", cart.id);

    processed += 1;
  }

  return { processed };
}

async function sendBroadcastPush(input: { heading: string; message: string; url: string }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return { status: "skipped" as const };
  }

  const response = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ["Subscribed Users"],
      headings: { en: input.heading },
      contents: { en: input.message },
      url: input.url
    })
  });

  if (!response.ok) {
    return { status: "failed" as const, body: await response.text() };
  }

  return { status: "sent" as const, body: await response.text() };
}

export async function processScheduledCampaigns(supabase: any) {
  const { data: campaigns, error } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(10);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST204") {
      return { processed: 0, skipped: "notification_campaigns table missing" };
    }

    throw error;
  }

  let processed = 0;

  for (const campaign of campaigns ?? []) {
    const channel = String(campaign.channel ?? "email");
    const url = campaign.cta_url || absoluteUrl("/shop");
    let sent = 0;
    let failed = 0;

    if (channel === "email" || channel === "email_push") {
      const { data: subscribers, error: subscriberError } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!subscriberError) {
        for (const subscriber of subscribers ?? []) {
          const email = premiumEmailTemplates.promoCampaign({
            title: campaign.subject || campaign.name,
            body: campaign.body,
            url
          });
          const result = await sendEmailNotificationIfConfigured({
            to: subscriber.email,
            subject: campaign.subject || campaign.name,
            html: email.html,
            text: email.text
          });

          if (result.status === "sent") {
            sent += 1;
          } else {
            failed += 1;
          }

          await logEmailEvent(supabase, {
            email: subscriber.email,
            templateKey: "promo_campaign",
            subject: campaign.subject || campaign.name,
            status: result.status,
            metadata: { campaign_id: campaign.id }
          }).catch(() => null);
        }
      }
    }

    if (channel === "push" || channel === "email_push") {
      const result = await sendBroadcastPush({
        heading: campaign.subject || campaign.name,
        message: campaign.body,
        url
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    await supabase
      .from("notification_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        metrics: {
          sent,
          failed
        }
      })
      .eq("id", campaign.id);

    processed += 1;
  }

  return { processed };
}
