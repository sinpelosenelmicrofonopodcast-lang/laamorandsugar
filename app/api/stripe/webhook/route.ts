/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  createOrderMessage,
  ensureOrderStatusHistory,
  notifyCustomerAboutOrderUpdate
} from "@/lib/order-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid webhook signature"
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient() as any;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();

        await supabase
          .from("orders")
          .update({
            status: "confirmed",
            order_status: "paid",
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            payment_provider: "stripe",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            payment_response: session
          })
          .eq("id", orderId);

        if (order) {
          await ensureOrderStatusHistory(supabase, {
            orderId,
            oldStatus: order.order_status ?? "pending_review",
            newStatus: "paid",
            note: "We received your payment and your order is confirmed.",
            changedBy: "system",
            customerVisible: true
          });
          await createOrderMessage(supabase, {
            orderId,
            senderType: "system",
            senderName: "L&A Amor & Sugar",
            messageBody: "We received your payment and your order is confirmed.",
            isRead: false
          });
          await notifyCustomerAboutOrderUpdate(
            supabase,
            {
              ...order,
              order_status: "paid",
              payment_status: "paid",
              status: "confirmed",
              paid_at: new Date().toISOString()
            },
            {
              notificationType: "payment_received",
              message: "We received your payment and your order is confirmed.",
              status: "paid"
            }
          );
        }
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        await supabase.from("orders").update({ status: "canceled" }).eq("id", orderId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
