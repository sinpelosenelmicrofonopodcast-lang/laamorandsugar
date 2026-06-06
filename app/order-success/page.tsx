import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById } from "@/lib/data/queries";
import { getOrderDepositSummary, getOrderPaymentStatusCopy } from "@/lib/order-payments";
import { formatCurrency } from "@/lib/utils";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Order Success",
  description: "Your order has been created successfully.",
  path: "/order-success"
});

type OrderSuccessPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

export default async function OrderSuccessPage({
  searchParams
}: OrderSuccessPageProps) {
  const params = await searchParams;
  const order = params.order ? await getOrderById(params.order) : null;
  const paymentMeta =
    order?.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as {
          payment_label?: string | null;
          payment_kind?: string | null;
          payment_account?: string | null;
          payment_url?: string | null;
          payment_instructions?: string | null;
          manual_payment_note?: string | null;
        })
      : null;
  const paymentSummary = order ? getOrderDepositSummary(order) : null;
  const paymentStatusCopy = order ? getOrderPaymentStatusCopy(order) : null;

  return (
    <div className="container py-16">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Order received
          </p>
          <CardTitle>Your treats are officially in motion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Thank you for your order. We have saved your fulfillment details and will keep your order status updated here.
          </p>
          {order ? (
            <div className="rounded-[1.75rem] bg-secondary/70 p-5">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Order
                  </p>
                  <p className="mt-2 font-medium text-foreground">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 font-medium capitalize text-foreground">
                    {order.status.replace(/_/g, " ")}
                  </p>
                  {paymentStatusCopy ? (
                    <p className="mt-1 text-xs text-muted-foreground">{paymentStatusCopy}</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    {formatCurrency(order.total)}
                  </p>
                </div>
                {paymentSummary ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Deposit Today
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatCurrency(paymentSummary.amountDueNow)}
                    </p>
                  </div>
                ) : null}
              </div>
              {paymentSummary ? (
                <div className="mt-4 rounded-[1.25rem] border border-bakery-gold/20 bg-white/75 px-4 py-4 text-sm">
                  <p>
                    <span className="font-medium text-foreground">Remaining balance:</span>{" "}
                    {formatCurrency(paymentSummary.remainingBalance)}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    The remaining 50% is due before pickup or delivery. We will confirm the next payment step with you.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          {paymentMeta?.payment_kind === "manual" ? (
            <div className="rounded-[1.75rem] border border-bakery-gold/20 bg-bakery-gold/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                Payment Instructions
              </p>
              <h2 className="mt-3 font-serif text-3xl text-foreground">
                Complete your 50% deposit with {paymentMeta.payment_label ?? "your selected method"}
              </h2>
              {paymentMeta.payment_instructions ? (
                <p className="mt-3 text-muted-foreground">{paymentMeta.payment_instructions}</p>
              ) : null}
              {paymentSummary ? (
                <p className="mt-3 text-muted-foreground">
                  Deposit due now: {formatCurrency(paymentSummary.amountDueNow)}. Remaining balance:{" "}
                  {formatCurrency(paymentSummary.remainingBalance)}.
                </p>
              ) : null}
              {paymentMeta.payment_account ? (
                <p className="mt-3">
                  <span className="font-medium text-foreground">Send payment to:</span>{" "}
                  {paymentMeta.payment_account}
                </p>
              ) : null}
              {paymentMeta.payment_url ? (
                <div className="mt-4">
                  <Button asChild variant="gold">
                    <a href={paymentMeta.payment_url} target="_blank" rel="noreferrer">
                      Open Payment Link
                    </a>
                  </Button>
                </div>
              ) : null}
              {paymentMeta.manual_payment_note ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {paymentMeta.manual_payment_note}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="gold">
              <Link href={order?.order_access_token ? `/order-status/${order.order_access_token}` : "/shop"}>
                {order?.order_access_token ? "View order status" : "Continue shopping"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/custom-orders">Request custom desserts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
