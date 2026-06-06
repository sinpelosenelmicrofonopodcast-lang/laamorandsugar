"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser, getCurrentUserRole, requireAdminAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createOrderMessage,
  getCustomerFacingOrderSummary,
  notifyCustomerAboutOrderUpdate,
  redeemOrderNewsletterDiscount,
  updateOrderStatusWithCommunication
} from "@/lib/order-service";
import { getErrorMessage } from "@/lib/utils";
import { logAdminAudit, logSuspiciousActivity } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getServerActionRequestContext } from "@/lib/security/request";
import { sanitizeUnknown } from "@/lib/security/sanitize";
import { getTurnstileToken, verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  customerOrderMessageSchema,
  orderLookupSchema,
  orderMessageSchema,
  saveOrderPushSubscriptionSchema,
  updateCustomerOrderWorkflowSchema
} from "@/lib/validations";

async function getOrderByTokenWithAdminClient(token: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_messages(*), order_status_history(*)")
    .eq("order_access_token", token)
    .maybeSingle();

  return { supabase, order: data };
}

async function canCurrentUserAccessOrder(order: {
  user_id?: string | null;
}) {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentUserRole()]);

  if (!order.user_id) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (role === "admin" || role === "staff") {
    return true;
  }

  return user.id === order.user_id;
}

export async function lookupOrderStatusAction(input: unknown) {
  try {
    const context = await getServerActionRequestContext();
    const rate = checkRateLimit({
      key: `order-lookup:${context.ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "order_lookup_rate_limited",
        reason: "Too many order lookup attempts from the same IP.",
        severity: "medium"
      });
      return { error: "Too many lookup attempts. Please wait and try again." };
    }

    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(input),
      expectedAction: "order_lookup"
    });

    if (!turnstile.success) {
      return { error: turnstile.error ?? "Human verification failed." };
    }

    const values = orderLookupSchema.parse(sanitizeUnknown(input));
    const supabase = createAdminClient() as any;
    let query = supabase
      .from("orders")
      .select("order_access_token,user_id,customer_email,customer_phone")
      .eq("order_number", values.order_number)
      .limit(1);

    if (values.email?.trim()) {
      query = query.eq("customer_email", values.email.trim());
    } else if (values.phone?.trim()) {
      query = query.eq("customer_phone", values.phone.trim());
    }

    const { data } = await query.maybeSingle();

    if (!data?.order_access_token) {
      return {
        error: "We couldn’t find an order with that information. Please double-check and try again."
      };
    }

    if (data.user_id) {
      const allowed = await canCurrentUserAccessOrder({ user_id: data.user_id });

      if (!allowed) {
        return {
          error: "Please sign in to the customer account that placed this order to view updates and messages."
        };
      }
    }

    redirect(`/order-status/${data.order_access_token}`);
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function sendCustomerOrderMessageAction(input: unknown) {
  try {
    const context = await getServerActionRequestContext();
    const rate = checkRateLimit({
      key: `customer-message:${context.ip}`,
      limit: 12,
      windowMs: 60 * 60 * 1000
    });

    if (rate.limited) {
      await logSuspiciousActivity({
        event: "customer_message_rate_limited",
        reason: "Too many customer messages from the same IP.",
        severity: "medium"
      });
      return { error: "Too many messages. Please wait and try again." };
    }

    const turnstile = await verifyTurnstileToken({
      token: getTurnstileToken(input),
      expectedAction: "customer_message"
    });

    if (!turnstile.success) {
      return { error: turnstile.error ?? "Human verification failed." };
    }

    const values = customerOrderMessageSchema.parse(sanitizeUnknown(input));
    const { supabase, order } = await getOrderByTokenWithAdminClient(values.order_token);

    if (!order) {
      return {
        error: "We couldn’t find that order."
      };
    }

    const allowed = await canCurrentUserAccessOrder(order);

    if (!allowed) {
      return {
        error: "Please sign in to the customer account that placed this order."
      };
    }

    await createOrderMessage(supabase, {
      orderId: order.id,
      senderType: "customer",
      senderName: order.customer_name,
      senderEmail: order.customer_email,
      messageBody: values.message_body,
      attachmentUrl: values.attachment_url ?? null,
      isRead: false
    });

    revalidatePath(`/order-status/${values.order_token}`);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);

    return { success: true };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function saveOrderPushSubscriptionAction(input: unknown) {
  try {
    const values = saveOrderPushSubscriptionSchema.parse(input);
    const { supabase, order } = await getOrderByTokenWithAdminClient(values.order_token);

    if (!order) {
      return {
        error: "We couldn’t find that order."
      };
    }

    const allowed = await canCurrentUserAccessOrder(order);

    if (!allowed) {
      return {
        error: "Please sign in to the customer account that placed this order."
      };
    }

    const metadata =
      order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
        ? order.metadata
        : {};

    const { error } = await supabase
      .from("orders")
      .update({
        metadata: {
          ...metadata,
          onesignal_subscription_id: values.subscription_id
        }
      })
      .eq("id", order.id);

    if (error) {
      throw error;
    }

    revalidatePath(`/order-status/${values.order_token}`);
    return { success: true };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function sendAdminOrderMessageAction(input: unknown) {
  try {
    const { user, role } = await requireAdminAccess();
    const values = orderMessageSchema.parse(sanitizeUnknown(input));
    const supabase = createAdminClient() as any;
    const { data: order } = await supabase.from("orders").select("*").eq("id", values.orderId).maybeSingle();

    if (!order) {
      return {
        error: "Order not found."
      };
    }

    await createOrderMessage(supabase, {
      orderId: order.id,
      senderType: "admin",
      senderName: user.user_metadata?.full_name || user.email || "L&A Amor & Sugar",
      senderEmail: user.email ?? null,
      messageBody: values.message_body,
      attachmentUrl: values.attachment_url ?? null,
      isRead: false
    });

    await notifyCustomerAboutOrderUpdate(supabase, order, {
      notificationType: "new_message",
      message: values.message_body
    });

    await supabase
      .from("order_messages")
      .update({ is_read: true })
      .eq("order_id", order.id)
      .eq("sender_type", "customer")
      .eq("is_read", false);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(`/order-status/${order.order_access_token}`);

    await logAdminAudit({
      actorId: user.id,
      actorRole: role,
      action: "admin_order_message_sent",
      targetType: "order",
      targetId: order.id
    });

    return { success: true };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function updateCustomerOrderWorkflowAction(input: unknown) {
  try {
    const { user, role } = await requireAdminAccess();
    const values = updateCustomerOrderWorkflowSchema.parse(sanitizeUnknown(input));
    const supabase = createAdminClient() as any;
    const { data: order } = await supabase.from("orders").select("*").eq("id", values.orderId).maybeSingle();

    if (!order) {
      return {
        error: "Order not found."
      };
    }

    if (values.payment_status) {
      const { error: paymentError } = await supabase
        .from("orders")
        .update({
          payment_status: values.payment_status,
          paid_at:
            values.payment_status === "paid"
              ? order.paid_at ?? new Date().toISOString()
              : order.paid_at
        })
        .eq("id", order.id);

      if (paymentError) {
        throw paymentError;
      }

      if (values.payment_status === "paid") {
        await redeemOrderNewsletterDiscount(supabase, order);
      }
    }

    await updateOrderStatusWithCommunication(supabase, order, {
      newStatus: values.order_status,
      note: values.note ?? null,
      changedBy: user.user_metadata?.full_name || user.email || "Admin",
      customerVisible: values.customer_visible,
      estimatedReadyAt: values.estimated_ready_at ?? null,
      pickupDate: values.pickup_date ?? null,
      deliveryDate: values.delivery_date ?? null,
      internalNotes: values.internal_notes ?? null
    });

    await supabase
      .from("order_messages")
      .update({ is_read: true })
      .eq("order_id", order.id)
      .eq("sender_type", "customer")
      .eq("is_read", false);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);

    await logAdminAudit({
      actorId: user.id,
      actorRole: role,
      action: "admin_order_workflow_updated",
      targetType: "order",
      targetId: order.id,
      metadata: {
        order_status: values.order_status,
        payment_status: values.payment_status ?? null
      }
    });
    revalidatePath(`/order-status/${order.order_access_token}`);

    return { success: true };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function markOrderMessagesReadAction(input: {
  orderId: string;
  senderType: "customer" | "admin" | "system";
}) {
  try {
    await requireAdminAccess();
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("order_messages")
      .update({ is_read: true })
      .eq("order_id", input.orderId)
      .eq("sender_type", input.senderType)
      .eq("is_read", false);

    if (error) {
      throw error;
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);

    return { success: true };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function getCustomerOrderStatusSummaryAction(token: string) {
  try {
    const { order } = await getOrderByTokenWithAdminClient(token);
    if (!order) {
      return { error: "Order not found." };
    }

    const allowed = await canCurrentUserAccessOrder(order);

    if (!allowed) {
      return {
        error: "Please sign in to the customer account that placed this order."
      };
    }

    return {
      success: true,
      summary: getCustomerFacingOrderSummary(order)
    };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}
