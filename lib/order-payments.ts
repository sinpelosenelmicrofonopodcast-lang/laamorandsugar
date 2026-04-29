const ORDER_DEPOSIT_PERCENT = 0.5;

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDepositBreakdown(total: number) {
  const orderTotal = roundCurrency(Math.max(0, total));
  const amountDueNow = roundCurrency(orderTotal * ORDER_DEPOSIT_PERCENT);
  const remainingBalance = roundCurrency(orderTotal - amountDueNow);

  return {
    paymentPlan: "deposit_50" as const,
    depositPercent: 50,
    orderTotal,
    amountDueNow,
    remainingBalance
  };
}

export function getOrderDepositSummary(order: {
  total: number;
  payment_status?: string | null;
  metadata?: unknown;
}) {
  const defaultBreakdown = calculateDepositBreakdown(order.total);
  const metadata =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as {
          payment_plan?: unknown;
          deposit_percent?: unknown;
          payment_due_now?: unknown;
          remaining_balance?: unknown;
        })
      : null;

  const isDepositPlan =
    metadata?.payment_plan === "deposit_50" ||
    typeof metadata?.payment_due_now === "number" ||
    typeof metadata?.remaining_balance === "number";

  const amountDueNow =
    typeof metadata?.payment_due_now === "number"
      ? roundCurrency(metadata.payment_due_now)
      : defaultBreakdown.amountDueNow;
  const remainingBalance =
    typeof metadata?.remaining_balance === "number"
      ? roundCurrency(metadata.remaining_balance)
      : defaultBreakdown.remainingBalance;
  const depositPercent =
    typeof metadata?.deposit_percent === "number"
      ? metadata.deposit_percent
      : defaultBreakdown.depositPercent;

  return {
    isDepositPlan,
    depositPercent,
    amountDueNow,
    remainingBalance,
    amountPaidNow: order.payment_status === "paid" ? amountDueNow : 0,
    orderTotal: defaultBreakdown.orderTotal
  };
}

export function getOrderPaymentStatusCopy(order: {
  total: number;
  payment_status?: string | null;
  metadata?: unknown;
}) {
  const summary = getOrderDepositSummary(order);

  if (!summary.isDepositPlan) {
    return null;
  }

  if (order.payment_status === "paid") {
    return `${summary.depositPercent}% Deposit Paid`;
  }

  if (order.payment_status === "failed") {
    return `${summary.depositPercent}% Deposit Failed`;
  }

  if (order.payment_status === "refunded") {
    return `${summary.depositPercent}% Deposit Refunded`;
  }

  return `${summary.depositPercent}% Deposit Pending`;
}
