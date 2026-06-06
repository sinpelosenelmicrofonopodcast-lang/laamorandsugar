/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { subscribeNewsletterEmail } from "@/lib/newsletter";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { premiumEmailTemplates } from "@/lib/email-templates";
import { getSiteSettings } from "@/lib/data/queries";
import { sendEmailNotificationIfConfigured } from "@/lib/order-service";
import { logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { getTurnstileToken, verifyTurnstileToken } from "@/lib/security/turnstile";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rate = checkRateLimit({
      key: `newsletter:${context.ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "newsletter_rate_limited",
        reason: "Too many newsletter signup attempts.",
        request,
        severity: "medium"
      });
      return NextResponse.json({ error: "Too many signup attempts. Please wait and try again." }, { status: 429 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Newsletter signup is temporarily unavailable." }, { status: 400 });
    }

    const body = (await request.json()) as { email?: string };
    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(body),
      headers: request.headers,
      expectedAction: "newsletter"
    });

    if (!turnstile.success) {
      return NextResponse.json({ error: turnstile.error ?? "Human verification failed." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const result = await subscribeNewsletterEmail(supabase, body.email ?? "");

    if (result.error || !result.subscriber) {
      return NextResponse.json({ error: result.error ?? "Unable to subscribe." }, { status: 400 });
    }

    if (!result.alreadySubscribed) {
      try {
        const welcome = premiumEmailTemplates.newsletterWelcome({
          discountCode: result.subscriber.discount_code,
          shopUrl: absoluteUrl("/shop")
        });
        await sendEmailNotificationIfConfigured({
          to: result.subscriber.email,
          subject: "Welcome to the L&A Amor & Sugar Sweet List",
          html: welcome.html,
          text: welcome.text
        });

        const settings = await getSiteSettings();
        if (settings.support_email) {
          const admin = premiumEmailTemplates.promoCampaign({
            title: "New Sweet List subscriber",
            body: `${result.subscriber.email} joined the Sweet List and received code ${result.subscriber.discount_code}.`,
            url: absoluteUrl("/admin/coupons")
          });
          await sendEmailNotificationIfConfigured({
            to: settings.support_email,
            subject: "New Sweet List signup",
            html: admin.html,
            text: admin.text
          });
        }
      } catch (notificationError) {
        console.error("[newsletter:notifications]", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed: result.alreadySubscribed,
      discount_code: result.subscriber.discount_code,
      discount_percent: result.subscriber.discount_percent,
      discount_used: result.subscriber.discount_used,
      message: result.alreadySubscribed
        ? "This email is already subscribed. Your one-time discount may have already been issued."
        : "You're in! Check your email for your 10% discount."
    });
  } catch (error) {
    console.error("[newsletter-subscribe]", error);
    return NextResponse.json(
      { error: "Unable to subscribe." },
      { status: 500 }
    );
  }
}
