"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createOrderMessage,
  getCustomerFacingOrderSummary,
  notifyCustomerAboutOrderUpdate,
  updateOrderStatusWithCommunication
} from "@/lib/order-service";
import { getErrorMessage } from "@/lib/utils";
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

export async function lookupOrderStatusAction(input: unknown) {
  try {
    const values = orderLookupSchema.parse(input);
    const supabase = createAdminClient() as any;
    let query = supabase.from("orders").select("order_access_token").eq("order_number", values.order_number).limit(1);

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

    redirect(`/order-status/${data.order_access_token}`);
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function sendCustomerOrderMessageAction(input: unknown) {
  try {
    const values = customerOrderMessageSchema.parse(input);
    const { supabase, order } = await getOrderByTokenWithAdminClient(values.order_token);

    if (!order) {
      return {
        error: "We couldn’t find that order."
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
    const { user } = await requireAdminAccess();
    const values = orderMessageSchema.parse(input);
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

    return { success: true };
  } catch (error) {
    return {
      error: getErrorMessage(error)
    };
  }
}

export async function updateCustomerOrderWorkflowAction(input: unknown) {
  try {
    const { user } = await requireAdminAccess();
    const values = updateCustomerOrderWorkflowSchema.parse(input);
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
