export const CUSTOMER_ORDER_STATUSES = [
  "pending_review",
  "confirmed",
  "payment_pending",
  "paid",
  "in_progress",
  "decorating",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled"
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export type CustomerOrderStatus = (typeof CUSTOMER_ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CUSTOMER_ORDER_STATUS_LABELS: Record<CustomerOrderStatus, string> = {
  pending_review: "Pending Review",
  confirmed: "Confirmed",
  payment_pending: "Payment Pending",
  paid: "Paid",
  in_progress: "In Preparation",
  decorating: "Decorating",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const CUSTOMER_ORDER_STATUS_MESSAGES: Record<CustomerOrderStatus, string> = {
  pending_review: "We received your order and will review it shortly.",
  confirmed: "Your order has been confirmed.",
  payment_pending: "We’re waiting for payment confirmation before we begin.",
  paid: "Your payment has been received.",
  in_progress: "We’re making your treats fresh right now.",
  decorating: "We’re adding the finishing details to your sweet gift.",
  ready_for_pickup: "Your order is ready for pickup.",
  out_for_delivery: "Your order is on the way.",
  delivered: "Your order has been delivered. We hope it made the moment sweeter.",
  completed: "Your order has been completed. Thank you for choosing L&A Amor & Sugar.",
  cancelled: "This order has been cancelled."
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded"
};

export const ORDER_PROGRESS_STEPS = [
  { key: "received", label: "Order Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "handoff", label: "Ready / Delivery" },
  { key: "completed", label: "Completed" }
] as const;

export function getCustomerOrderStatusLabel(status: string | null | undefined) {
  if (!status) {
    return CUSTOMER_ORDER_STATUS_LABELS.pending_review;
  }

  return CUSTOMER_ORDER_STATUS_LABELS[status as CustomerOrderStatus] ?? status.replace(/_/g, " ");
}

export function getCustomerOrderStatusMessage(status: string | null | undefined) {
  if (!status) {
    return CUSTOMER_ORDER_STATUS_MESSAGES.pending_review;
  }

  return CUSTOMER_ORDER_STATUS_MESSAGES[status as CustomerOrderStatus] ?? "";
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  if (!status) {
    return PAYMENT_STATUS_LABELS.pending;
  }

  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status.replace(/_/g, " ");
}

export function mapCustomerOrderStatusToLegacyStatus(
  status: CustomerOrderStatus
): "pending" | "confirmed" | "in_progress" | "ready" | "delivered" | "canceled" {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "in_progress":
    case "decorating":
      return "in_progress";
    case "ready_for_pickup":
    case "out_for_delivery":
      return "ready";
    case "delivered":
    case "completed":
      return "delivered";
    case "cancelled":
      return "canceled";
    default:
      return "pending";
  }
}

export function deriveCustomerOrderStatus(input: {
  order_status?: string | null;
  status?: string | null;
  payment_status?: string | null;
}) {
  if (input.order_status && CUSTOMER_ORDER_STATUSES.includes(input.order_status as CustomerOrderStatus)) {
    return input.order_status as CustomerOrderStatus;
  }

  if (input.status === "canceled") {
    return "cancelled";
  }

  if (input.status === "delivered") {
    return "delivered";
  }

  if (input.status === "ready") {
    return "ready_for_pickup";
  }

  if (input.status === "in_progress") {
    return "in_progress";
  }

  if (input.status === "confirmed") {
    return input.payment_status === "paid" ? "paid" : "confirmed";
  }

  if (input.payment_status === "paid") {
    return "paid";
  }

  return "pending_review";
}

export function getOrderProgressStepIndex(status: CustomerOrderStatus) {
  switch (status) {
    case "pending_review":
    case "payment_pending":
      return 0;
    case "confirmed":
    case "paid":
      return 1;
    case "in_progress":
    case "decorating":
      return 2;
    case "ready_for_pickup":
    case "out_for_delivery":
      return 3;
    case "delivered":
    case "completed":
      return 4;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}
