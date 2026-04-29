/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";

import { OrderCommunicationPanel } from "@/components/admin/order-communication-panel";
import { StatusBadge } from "@/components/site/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById } from "@/lib/data/queries";
import { getOrderDepositSummary, getOrderPaymentStatusCopy } from "@/lib/order-payments";
import { getCustomerOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({
  params
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  await (createAdminClient() as any)
    .from("order_messages")
    .update({ is_read: true })
    .eq("order_id", order.id)
    .eq("sender_type", "customer")
    .eq("is_read", false);

  const paymentMeta =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as {
          payment_label?: string | null;
          payment_kind?: string | null;
          payment_account?: string | null;
          payment_url?: string | null;
          payment_instructions?: string | null;
          manual_payment_note?: string | null;
        })
      : null;
  const paymentSummary = getOrderDepositSummary(order);
  const paymentStatusCopy = getOrderPaymentStatusCopy(order);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
        <CardHeader>
          <CardTitle>{order.order_number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{order.customer_name}</p>
            <p>{order.customer_email}</p>
            <p>{order.customer_phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Customer-facing: {getCustomerOrderStatusLabel(order.order_status ?? order.status)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Fulfillment</p>
            <p className="capitalize">{order.fulfillment_method}</p>
            <p>{order.fulfillment_date}</p>
            <p>{order.fulfillment_time_slot}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Notes</p>
            <p>{order.notes ?? "No notes"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment</p>
            <p className="font-medium">
              {paymentMeta?.payment_label ??
                (order.stripe_checkout_session_id ? "Stripe" : "Not specified")}
            </p>
            <p className="text-sm text-muted-foreground">
              Status: {getPaymentStatusLabel(order.payment_status)}
            </p>
            {paymentStatusCopy ? <p className="text-sm text-muted-foreground">{paymentStatusCopy}</p> : null}
            <p className="text-sm text-muted-foreground">
              Deposit due now: {formatCurrency(paymentSummary.amountDueNow)}
            </p>
            <p className="text-sm text-muted-foreground">
              Remaining balance: {formatCurrency(paymentSummary.remainingBalance)}
            </p>
            {paymentMeta?.payment_account ? <p>{paymentMeta.payment_account}</p> : null}
            {paymentMeta?.payment_instructions ? (
              <p className="text-muted-foreground">{paymentMeta.payment_instructions}</p>
            ) : null}
            {paymentMeta?.manual_payment_note ? (
              <p className="text-muted-foreground">{paymentMeta.manual_payment_note}</p>
            ) : null}
            {order.paypal_order_id ? <p>PayPal order ID: {order.paypal_order_id}</p> : null}
            {order.paypal_capture_id ? <p>PayPal capture ID: {order.paypal_capture_id}</p> : null}
            {paymentMeta?.payment_url ? (
              <a
                href={paymentMeta.payment_url}
                target="_blank"
                rel="noreferrer"
                className="text-bakery-rose underline underline-offset-4"
              >
                Open payment link
              </a>
            ) : null}
          </div>
        </CardContent>
        </Card>
        <Card>
        <CardHeader>
          <CardTitle>Order items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-[1.5rem] border border-border px-4 py-4"
            >
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.variant_name ?? "Base"} • Qty {item.quantity}
                </p>
              </div>
              <p className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</p>
            </div>
          ))}
          <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-serif text-3xl text-bakery-rose">
                {formatCurrency(order.total)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>50% deposit</span>
              <span>{formatCurrency(paymentSummary.amountDueNow)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Remaining balance</span>
              <span>{formatCurrency(paymentSummary.remainingBalance)}</span>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
      <OrderCommunicationPanel order={order} />
    </div>
  );
}
