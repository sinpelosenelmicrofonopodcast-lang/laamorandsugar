/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from "crypto";

const NEWSLETTER_DISCOUNT_PERCENT = 10;

export type NewsletterSubscriber = {
  id: string;
  email: string;
  onesignal_id: string | null;
  discount_code: string;
  discount_percent: number;
  discount_used: boolean;
  discount_used_at: string | null;
  created_at: string;
};

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateNewsletterDiscountCode() {
  return `SWEET10-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function createUniqueDiscountCode(supabase: any) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateNewsletterDiscountCode();
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("discount_code", code)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  throw new Error("Could not generate a unique discount code. Please try again.");
}

export async function syncOneSignalNewsletterSubscriber(input: {
  email: string;
  discountCode: string;
  discountUsed?: boolean;
}) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return { skipped: true as const };
  }

  const response = await fetch("https://onesignal.com/api/v1/players", {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: appId,
      device_type: 11,
      identifier: input.email,
      tags: {
        newsletter_subscriber: "true",
        discount_code: input.discountCode,
        discount_used: input.discountUsed ? "true" : "false"
      }
    })
  });

  if (!response.ok) {
    return { skipped: false as const, error: await response.text() };
  }

  const data = (await response.json()) as { id?: string };
  return { skipped: false as const, onesignalId: data.id ?? null };
}

export async function subscribeNewsletterEmail(supabase: any, rawEmail: string) {
  const email = normalizeNewsletterEmail(rawEmail);

  if (!isValidNewsletterEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    await syncOneSignalNewsletterSubscriber({
      email,
      discountCode: existing.discount_code,
      discountUsed: existing.discount_used
    });

    return {
      subscriber: existing as NewsletterSubscriber,
      alreadySubscribed: true
    };
  }

  const discountCode = await createUniqueDiscountCode(supabase);
  const { data: subscriber, error } = await supabase
    .from("newsletter_subscribers")
    .insert({
      email,
      discount_code: discountCode,
      discount_percent: NEWSLETTER_DISCOUNT_PERCENT
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return subscribeNewsletterEmail(supabase, email);
    }

    throw error;
  }

  const oneSignalResult = await syncOneSignalNewsletterSubscriber({
    email,
    discountCode,
    discountUsed: false
  });

  if ("onesignalId" in oneSignalResult && oneSignalResult.onesignalId) {
    await supabase
      .from("newsletter_subscribers")
      .update({ onesignal_id: oneSignalResult.onesignalId })
      .eq("id", subscriber.id);
  }

  return {
    subscriber: {
      ...(subscriber as NewsletterSubscriber),
      onesignal_id:
        "onesignalId" in oneSignalResult
          ? oneSignalResult.onesignalId ?? subscriber.onesignal_id
          : subscriber.onesignal_id
    },
    alreadySubscribed: false
  };
}

export async function validateNewsletterDiscount(
  supabase: any,
  input: { email: string; discountCode: string; cartSubtotal: number }
) {
  const email = normalizeNewsletterEmail(input.email);
  const discountCode = input.discountCode.trim().toUpperCase();
  const subtotal = Math.max(0, Number(input.cartSubtotal) || 0);

  if (!isValidNewsletterEmail(email)) {
    return { error: "Please enter the subscriber email for this discount." };
  }

  if (!discountCode) {
    return { error: "Please enter a discount code." };
  }

  const { data: subscriber, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("email", email)
    .eq("discount_code", discountCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!subscriber) {
    return { error: "That Sweet List discount does not match this email." };
  }

  if (subscriber.discount_used) {
    return { error: "This one-time discount has already been used." };
  }

  const discountPercent = Number(subscriber.discount_percent ?? NEWSLETTER_DISCOUNT_PERCENT);
  const discountAmount = Math.min(subtotal, Number((subtotal * (discountPercent / 100)).toFixed(2)));

  return {
    subscriber: subscriber as NewsletterSubscriber,
    discountPercent,
    discountAmount,
    newTotal: Math.max(0, Number((subtotal - discountAmount).toFixed(2)))
  };
}

export async function redeemNewsletterDiscount(
  supabase: any,
  input: { email: string; discountCode: string; orderId?: string | null }
) {
  const email = normalizeNewsletterEmail(input.email);
  const discountCode = input.discountCode.trim().toUpperCase();

  if (!email || !discountCode) {
    return { skipped: true };
  }

  const { data: subscriber, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("email", email)
    .eq("discount_code", discountCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!subscriber) {
    return { skipped: true };
  }

  if (!subscriber.discount_used) {
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        discount_used: true,
        discount_used_at: new Date().toISOString()
      })
      .eq("id", subscriber.id)
      .eq("discount_used", false);

    if (updateError) {
      throw updateError;
    }
  }

  if (input.orderId) {
    const { data: existingRedemption } = await supabase
      .from("discount_redemptions")
      .select("id")
      .eq("discount_code", discountCode)
      .eq("order_id", input.orderId)
      .maybeSingle();

    if (!existingRedemption) {
      await supabase.from("discount_redemptions").insert({
        email,
        discount_code: discountCode,
        order_id: input.orderId
      });
    }
  }

  await syncOneSignalNewsletterSubscriber({
    email,
    discountCode,
    discountUsed: true
  });

  return { success: true };
}
