/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes, randomUUID } from "crypto";
import type Stripe from "stripe";

import { checkoutSchema, type CheckoutValues } from "@/lib/validations";
import { getSiteSettings } from "@/lib/data/queries";
import { getAvailablePaymentMethods } from "@/lib/payments";
import type { OrderRow, PaymentMethodCode, ProductRow } from "@/lib/types/app";
import {
  CUSTOMER_ORDER_STATUS_MESSAGES,
  CUSTOMER_ORDER_STATUS_LABELS,
  deriveCustomerOrderStatus,
  getCustomerOrderStatusLabel,
  getPaymentStatusLabel,
  mapCustomerOrderStatusToLegacyStatus,
  type CustomerOrderStatus
} from "@/lib/order-status";
import {
  absoluteUrl,
  resolveImageUrl,
  resolveVariantPrice,
  resolveVariantQuantity
} from "@/lib/utils";

type CheckoutProduct = Pick<ProductRow, "id" | "name" | "slug" | "base_price"> & {
  product_images?: { image_url?: string | null; url?: string | null; is_primary?: boolean }[];
};

type CheckoutVariant = {
  id: string;
  product_id: string;
  name: string;
  quantity?: number | null;
  price?: number | null;
  option_value?: string | null;
  price_delta?: number | null;
};

type CheckoutAddon = {
  id: string;
  product_id: string;
  name: string;
  price: number;
};

export type PreparedOrderItem = {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  addons: { id: string; name: string; price: number }[];
  image_url: string | null;
};

export type PreparedCheckoutOrder = {
  values: CheckoutValues;
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
  selectedPaymentMethod: {
    code: PaymentMethodCode;
    settings: {
      label: string;
      account: string | null;
      payment_url: string | null;
      instructions: string | null;
    };
    kind: "stripe" | "manual" | "paypal_live";
  };
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  taxTotal: number;
  total: number;
  orderItems: PreparedOrderItem[];
  stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  shippingAddress:
    | {
        line1: string | null | undefined;
        line2: string | null | undefined;
        city: string | null | undefined;
        state: string | null | undefined;
        zip: string | null | undefined;
      }
    | null;
};

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function generateOrderAccessToken() {
  return randomBytes(24).toString("hex");
}

export function generateOrderNumber() {
  return `LAS-${Date.now().toString().slice(-8)}`;
}

function getPayPalEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET
  );
}

export async function prepareCheckoutOrder(
  input: unknown,
  supabase: any
): Promise<{ data?: PreparedCheckoutOrder; error?: string }> {
  const values = checkoutSchema.parse(input);
  const settings = await getSiteSettings();
  const paymentMethods = getAvailablePaymentMethods(
    settings,
    Boolean(process.env.STRIPE_SECRET_KEY),
    getPayPalEnabled()
  );
  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.code === values.payment_method
  );

  if (!selectedPaymentMethod) {
    return {
      error: "That payment method is not available right now."
    };
  }

  const productIds = [...new Set(values.items.map((item) => item.productId))];
  const variantIds = [
    ...new Set(values.items.map((item) => item.variantId).filter(Boolean))
  ] as string[];

  const [{ data: products }, { data: variants }, { data: addons }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,slug,base_price,product_images(*)")
      .in("id", productIds),
    variantIds.length
      ? supabase.from("product_variants").select("*").in("id", variantIds)
      : Promise.resolve({ data: [] as never[], error: null }),
    productIds.length
      ? supabase
          .from("product_addons")
          .select("id,product_id,name,price")
          .in("product_id", productIds)
      : Promise.resolve({ data: [] as never[], error: null })
  ]);

  const typedProducts = ((products ?? []) as CheckoutProduct[]).map((product) => ({
    ...product,
    product_images: (product.product_images ?? [])
      .map((image) => ({
        ...image,
        image_url: resolveImageUrl(image)
      }))
      .filter((image) => Boolean(image.image_url))
  }));
  const typedVariants = ((variants ?? []) as CheckoutVariant[]).map((variant) => {
    const product = typedProducts.find((item) => item.id === variant.product_id);

    return {
      ...variant,
      quantity: resolveVariantQuantity(variant),
      price: resolveVariantPrice(variant, product?.base_price ?? 0)
    };
  });
  const typedAddons = (addons ?? []) as CheckoutAddon[];

  const productMap = new Map(typedProducts.map((product) => [product.id, product]));
  const variantMap = new Map(typedVariants.map((variant) => [variant.id, variant]));
  const addonMap = new Map(typedAddons.map((addon) => [addon.id, addon]));

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const orderItems: PreparedOrderItem[] = [];
  let subtotal = 0;

  for (const cartItem of values.items) {
    const product = productMap.get(cartItem.productId);

    if (!product) {
      return {
        error: "One of the selected products no longer exists."
      };
    }

    const variant = cartItem.variantId ? variantMap.get(cartItem.variantId) : null;
    const selectedAddons = cartItem.addons
      .map((addon) => addonMap.get(addon.id))
      .filter(Boolean) as CheckoutAddon[];
    const unitPrice =
      (variant?.price ?? product.base_price) +
      selectedAddons.reduce((sum, addon) => sum + (addon?.price ?? 0), 0);
    const itemSubtotal = unitPrice * cartItem.quantity;

    subtotal += itemSubtotal;

    stripeLineItems.push({
      quantity: cartItem.quantity,
      price_data: {
        currency: settings.currency.toLowerCase(),
        unit_amount: Math.round(unitPrice * 100),
        product_data: {
          name:
            variant?.name
              ? `${product.name} - ${variant.name} (${variant.quantity} pcs)`
              : product.name,
          images:
            product.product_images
              ?.sort(
                (a: { is_primary?: boolean }, b: { is_primary?: boolean }) =>
                  Number(b.is_primary) - Number(a.is_primary)
              )
              .map((image: { image_url?: string | null }) => image.image_url)
              .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
              .slice(0, 1) ?? [],
          description:
            selectedAddons.length > 0
              ? `Add-ons: ${selectedAddons.map((addon) => addon.name).join(", ")}`
              : undefined
        }
      }
    });

    orderItems.push({
      product_id: product.id,
      variant_id: variant?.id ?? null,
      product_name: product.name,
      variant_name: variant?.name ? `${variant.name} (${variant.quantity} pcs)` : null,
      unit_price: unitPrice,
      quantity: cartItem.quantity,
      addons: selectedAddons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      })),
      image_url: product.product_images?.[0]?.image_url ?? cartItem.image ?? null
    });
  }

  let discountTotal = 0;

  if (values.coupon_code) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", values.coupon_code.toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (coupon) {
      if (!coupon.minimum_order_amount || subtotal >= coupon.minimum_order_amount) {
        discountTotal =
          coupon.discount_type === "percentage"
            ? subtotal * (coupon.discount_value / 100)
            : coupon.discount_value;
        discountTotal = Math.min(discountTotal, subtotal);
      }
    }
  }

  const deliveryFee =
    values.fulfillment_method === "delivery" &&
    (!settings.free_delivery_threshold ||
      subtotal - discountTotal < settings.free_delivery_threshold)
      ? 20
      : 0;

  const taxTotal = 0;
  const total = subtotal - discountTotal + deliveryFee + taxTotal;

  return {
    data: {
      values,
      settings,
      selectedPaymentMethod,
      subtotal,
      discountTotal,
      deliveryFee,
      taxTotal,
      total,
      orderItems,
      stripeLineItems,
      shippingAddress:
        values.fulfillment_method === "delivery"
          ? {
              line1: values.delivery_address_line_1,
              line2: values.delivery_address_line_2,
              city: values.delivery_city,
              state: values.delivery_state,
              zip: values.delivery_zip
            }
          : null
    }
  };
}

export function buildOrderMetadata(
  prepared: PreparedCheckoutOrder,
  extra: Record<string, unknown> = {}
) {
  return {
    coupon_code: prepared.values.coupon_code ?? null,
    payment_method: prepared.selectedPaymentMethod.code,
    payment_label: prepared.selectedPaymentMethod.settings.label,
    payment_kind: prepared.selectedPaymentMethod.kind,
    payment_account: prepared.selectedPaymentMethod.settings.account,
    payment_url: prepared.selectedPaymentMethod.settings.payment_url,
    payment_instructions: prepared.selectedPaymentMethod.settings.instructions,
    manual_payment_note: prepared.settings.payment_settings.manual_payment_note,
    ...extra
  };
}

export async function createOrderRecord(
  supabase: any,
  prepared: PreparedCheckoutOrder,
  overrides: Partial<OrderRow> & { metadata?: Record<string, unknown> } = {}
) {
  const orderId = overrides.id ?? randomUUID();
  const orderNumber = overrides.order_number ?? generateOrderNumber();
  const orderAccessToken = overrides.order_access_token ?? generateOrderAccessToken();
  const orderStatus =
    overrides.order_status ??
    (prepared.selectedPaymentMethod.kind === "manual" ? "payment_pending" : "pending_review");
  const paymentStatus =
    overrides.payment_status ??
    (prepared.selectedPaymentMethod.kind === "manual" ? "pending" : "pending");
  const paymentProvider =
    overrides.payment_provider ??
    (prepared.selectedPaymentMethod.code === "stripe"
      ? "stripe"
      : prepared.selectedPaymentMethod.code === "paypal_live"
        ? "paypal"
        : "manual");

  const insertPayload = {
    id: orderId,
    order_number: orderNumber,
    order_access_token: orderAccessToken,
    customer_name: prepared.values.customer_name,
    customer_email: prepared.values.customer_email,
    customer_phone: prepared.values.customer_phone,
    fulfillment_method: prepared.values.fulfillment_method,
    fulfillment_date: prepared.values.fulfillment_date,
    fulfillment_time_slot: prepared.values.fulfillment_time_slot || null,
    notes: prepared.values.notes || null,
    subtotal: prepared.subtotal,
    discount_total: prepared.discountTotal,
    delivery_fee: prepared.deliveryFee,
    tax_total: prepared.taxTotal,
    total: prepared.total,
    status: overrides.status ?? mapCustomerOrderStatusToLegacyStatus(orderStatus as CustomerOrderStatus),
    order_status: orderStatus,
    payment_provider: paymentProvider,
    payment_status: paymentStatus,
    shipping_address: prepared.shippingAddress,
    metadata: buildOrderMetadata(prepared, overrides.metadata ?? {})
  };

  const { error: orderError } = await supabase.from("orders").insert(insertPayload);
  if (orderError) {
    throw orderError;
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    prepared.orderItems.map((item) => ({
      order_id: orderId,
      ...item
    }))
  );

  if (itemsError) {
    throw itemsError;
  }

  await ensureOrderStatusHistory(supabase, {
    orderId,
    oldStatus: null,
    newStatus: orderStatus,
    note: CUSTOMER_ORDER_STATUS_MESSAGES[orderStatus as CustomerOrderStatus] ?? null,
    changedBy: "system",
    customerVisible: true
  });

  return {
    orderId,
    orderNumber,
    orderAccessToken
  };
}

export async function ensureOrderStatusHistory(
  supabase: any,
  input: {
    orderId: string;
    oldStatus: string | null;
    newStatus: string;
    note?: string | null;
    changedBy: string;
    customerVisible?: boolean;
  }
) {
  await supabase.from("order_status_history").insert({
    order_id: input.orderId,
    old_status: input.oldStatus,
    new_status: input.newStatus,
    note: input.note ?? null,
    changed_by: input.changedBy,
    customer_visible: input.customerVisible ?? true
  });
}

export async function createOrderMessage(
  supabase: any,
  input: {
    orderId: string;
    senderType: "customer" | "admin" | "system";
    senderName: string;
    senderEmail?: string | null;
    messageBody: string;
    attachmentUrl?: string | null;
    isRead?: boolean;
  }
) {
  const { error } = await supabase.from("order_messages").insert({
    order_id: input.orderId,
    sender_type: input.senderType,
    sender_name: input.senderName,
    sender_email: input.senderEmail ?? null,
    message_body: input.messageBody,
    attachment_url: input.attachmentUrl ?? null,
    is_read: input.isRead ?? false
  });

  if (error) {
    throw error;
  }

  await supabase
    .from("orders")
    .update(
      input.senderType === "customer"
        ? { last_customer_message_at: new Date().toISOString() }
        : { last_admin_message_at: new Date().toISOString() }
    )
    .eq("id", input.orderId);
}

export function buildOrderStatusEmailContent(input: {
  customerName: string;
  orderNumber: string;
  status: string;
  message: string;
  fulfillmentMethod: string;
  fulfillmentDate: string;
  fulfillmentTimeSlot?: string | null;
  orderAccessToken?: string | null;
}) {
  const statusLabel = getCustomerOrderStatusLabel(input.status);
  const url = input.orderAccessToken
    ? absoluteUrl(`/order-status/${input.orderAccessToken}`)
    : absoluteUrl("/order-status");
  const fulfillmentLabel =
    input.fulfillmentMethod === "delivery" ? "Delivery details" : "Pickup details";
  const fulfillmentText = [input.fulfillmentDate, input.fulfillmentTimeSlot]
    .filter(Boolean)
    .join(" • ");

  return {
    text: `Hi ${input.customerName},\n\n${input.message}\n\nOrder number: ${input.orderNumber}\nCurrent status: ${statusLabel}\n${fulfillmentLabel}: ${fulfillmentText || "We will confirm the timing soon."}\n\nView your order: ${url}\n\nL&A Amor & Sugar`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#fff9fb;padding:24px;color:#3a2d32;">
        <div style="max-width:640px;margin:0 auto;background:white;border-radius:24px;padding:32px;border:1px solid #f5d8df;">
          <p style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#c69b38;font-weight:700;margin:0 0 16px;">L&A Amor & Sugar</p>
          <h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2;margin:0 0 16px;">${statusLabel}</h1>
          <p style="font-size:16px;line-height:1.8;margin:0 0 18px;">Hi ${input.customerName},</p>
          <p style="font-size:16px;line-height:1.8;margin:0 0 22px;">${input.message}</p>
          <div style="background:#fff4f7;border-radius:18px;padding:18px;margin-bottom:24px;">
            <p style="margin:0 0 8px;"><strong>Order number:</strong> ${input.orderNumber}</p>
            <p style="margin:0 0 8px;"><strong>Current status:</strong> ${statusLabel}</p>
            <p style="margin:0;"><strong>${fulfillmentLabel}:</strong> ${fulfillmentText || "We will confirm the timing soon."}</p>
          </div>
          <a href="${url}" style="display:inline-block;background:#d4a437;color:white;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">View order status</a>
        </div>
      </div>
    `
  };
}

export function getOrderEmailSubject(status: string, notificationType = "status_update") {
  if (notificationType === "new_message") {
    return "New message about your L&A Amor & Sugar order";
  }

  switch (status) {
    case "confirmed":
      return "Your L&A Amor & Sugar order is confirmed 💖";
    case "ready_for_pickup":
      return "Your sweet order is ready for pickup 🍓";
    case "out_for_delivery":
      return "Your L&A Amor & Sugar order is out for delivery 🚗";
    case "completed":
      return "Your L&A Amor & Sugar order has been completed";
    case "paid":
      return "We received your payment for your L&A Amor & Sugar order";
    default:
      return "Update about your L&A Amor & Sugar order";
  }
}

export async function createOrderNotification(
  supabase: any,
  input: {
    orderId: string;
    notificationType: string;
    channel: "email" | "in_app" | "push";
    recipient: string;
    subject?: string | null;
    body: string;
    status?: string;
    sentAt?: string | null;
  }
) {
  await supabase.from("order_notifications").insert({
    order_id: input.orderId,
    notification_type: input.notificationType,
    channel: input.channel,
    recipient: input.recipient,
    subject: input.subject ?? null,
    body: input.body,
    status: input.status ?? "pending",
    sent_at: input.sentAt ?? null
  });
}

export async function sendEmailNotificationIfConfigured(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      status: "skipped" as const
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!response.ok) {
    return {
      status: "failed" as const,
      body: await response.text()
    };
  }

  return {
    status: "sent" as const,
    body: await response.text()
  };
}

export async function sendPushNotificationIfConfigured(input: {
  subscriptionId?: string | null;
  heading: string;
  message: string;
  url: string;
}) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!input.subscriptionId || !appId || !apiKey) {
    return {
      status: "skipped" as const
    };
  }

  const response = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: appId,
      include_subscription_ids: [input.subscriptionId],
      headings: { en: input.heading },
      contents: { en: input.message },
      url: input.url
    })
  });

  if (!response.ok) {
    return {
      status: "failed" as const,
      body: await response.text()
    };
  }

  return {
    status: "sent" as const,
    body: await response.text()
  };
}

export async function notifyCustomerAboutOrderUpdate(
  supabase: any,
  order: OrderRow,
  input: {
    notificationType: string;
    message: string;
    status?: string | null;
  }
) {
  const customerStatus = deriveCustomerOrderStatus({
    order_status: order.order_status,
    status: order.status,
    payment_status: order.payment_status
  });
  const emailContent = buildOrderStatusEmailContent({
    customerName: order.customer_name,
    orderNumber: order.order_number,
    status: input.status ?? customerStatus,
    message: input.message,
    fulfillmentMethod: order.fulfillment_method,
    fulfillmentDate: order.fulfillment_date,
    fulfillmentTimeSlot: order.fulfillment_time_slot,
    orderAccessToken: order.order_access_token
  });
  const subject = getOrderEmailSubject(input.status ?? customerStatus, input.notificationType);

  const emailResult = await sendEmailNotificationIfConfigured({
    to: order.customer_email,
    subject,
    html: emailContent.html,
    text: emailContent.text
  });
  await createOrderNotification(supabase, {
    orderId: order.id,
    notificationType: input.notificationType,
    channel: "email",
    recipient: order.customer_email,
    subject,
    body: input.message,
    status: emailResult.status,
    sentAt: emailResult.status === "sent" ? new Date().toISOString() : null
  });
  await createOrderNotification(supabase, {
    orderId: order.id,
    notificationType: input.notificationType,
    channel: "in_app",
    recipient: order.customer_email,
    subject,
    body: input.message,
    status: "sent",
    sentAt: new Date().toISOString()
  });

  const subscriptionId =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? ((order.metadata as { onesignal_subscription_id?: string | null })
          .onesignal_subscription_id ?? null)
      : null;
  const pushResult = await sendPushNotificationIfConfigured({
    subscriptionId,
    heading: subject,
    message: input.message,
    url: order.order_access_token
      ? absoluteUrl(`/order-status/${order.order_access_token}`)
      : absoluteUrl("/order-status")
  });
  await createOrderNotification(supabase, {
    orderId: order.id,
    notificationType: input.notificationType,
    channel: "push",
    recipient: subscriptionId ?? order.customer_email,
    subject,
    body: input.message,
    status: pushResult.status,
    sentAt: pushResult.status === "sent" ? new Date().toISOString() : null
  });
}

export async function updateOrderStatusWithCommunication(
  supabase: any,
  order: OrderRow,
  input: {
    newStatus: CustomerOrderStatus;
    note?: string | null;
    changedBy: string;
    customerVisible?: boolean;
    estimatedReadyAt?: string | null;
    pickupDate?: string | null;
    deliveryDate?: string | null;
    internalNotes?: string | null;
  }
) {
  const legacyStatus = mapCustomerOrderStatusToLegacyStatus(input.newStatus);
  const updatePayload: Record<string, unknown> = {
    status: legacyStatus,
    order_status: input.newStatus
  };

  if (typeof input.estimatedReadyAt !== "undefined") {
    updatePayload.estimated_ready_at = input.estimatedReadyAt;
  }
  if (typeof input.pickupDate !== "undefined") {
    updatePayload.pickup_date = input.pickupDate;
  }
  if (typeof input.deliveryDate !== "undefined") {
    updatePayload.delivery_date = input.deliveryDate;
  }
  if (typeof input.internalNotes !== "undefined") {
    updatePayload.internal_notes = input.internalNotes;
  }
  if (input.newStatus === "paid") {
    updatePayload.payment_status = "paid";
    updatePayload.paid_at = order.paid_at ?? new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updatePayload).eq("id", order.id);
  if (error) {
    throw error;
  }

  await ensureOrderStatusHistory(supabase, {
    orderId: order.id,
    oldStatus: deriveCustomerOrderStatus({
      order_status: order.order_status,
      status: order.status,
      payment_status: order.payment_status
    }),
    newStatus: input.newStatus,
    note: input.note ?? null,
    changedBy: input.changedBy,
    customerVisible: input.customerVisible ?? true
  });

  const systemMessage =
    input.note?.trim() || CUSTOMER_ORDER_STATUS_MESSAGES[input.newStatus] || "Your order has been updated.";

  if (input.customerVisible ?? true) {
    await createOrderMessage(supabase, {
      orderId: order.id,
      senderType: "system",
      senderName: "L&A Amor & Sugar",
      messageBody: systemMessage,
      isRead: false
    });
  }

  const freshOrder = {
    ...order,
    ...updatePayload
  } as OrderRow;

  await notifyCustomerAboutOrderUpdate(supabase, freshOrder, {
    notificationType: "status_update",
    message: systemMessage,
    status: input.newStatus
  });
}

export function getCustomerFacingOrderSummary(order: OrderRow) {
  const orderStatus = deriveCustomerOrderStatus({
    order_status: order.order_status,
    status: order.status,
    payment_status: order.payment_status
  });

  return {
    orderStatus,
    orderStatusLabel: CUSTOMER_ORDER_STATUS_LABELS[orderStatus],
    orderStatusMessage: CUSTOMER_ORDER_STATUS_MESSAGES[orderStatus],
    paymentStatusLabel: getPaymentStatusLabel(order.payment_status)
  };
}
