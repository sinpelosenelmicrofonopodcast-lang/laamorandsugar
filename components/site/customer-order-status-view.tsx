"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { sendCustomerOrderMessageAction } from "@/actions/order-communication";
import { OrderProgressTracker } from "@/components/site/order-progress-tracker";
import { OrderPushOptInButton } from "@/components/site/order-push-opt-in-button";
import { StatusBadge } from "@/components/site/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deriveCustomerOrderStatus,
  getCustomerOrderStatusLabel,
  getCustomerOrderStatusMessage,
  getPaymentStatusLabel
} from "@/lib/order-status";
import { getOrderDepositSummary, getOrderPaymentStatusCopy } from "@/lib/order-payments";
import type { OrderWithItems } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";

export function CustomerOrderStatusView({
  order,
  orderToken
}: {
  order: OrderWithItems;
  orderToken: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [messageBody, setMessageBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const orderStatus = deriveCustomerOrderStatus({
    order_status: order.order_status,
    status: order.status,
    payment_status: order.payment_status
  });
  const paymentSummary = getOrderDepositSummary(order);
  const paymentStatusCopy = getOrderPaymentStatusCopy(order);
  const latestVisibleMessage = useMemo(() => {
    const messages = (order.order_messages ?? [])
      .filter((message) => message.sender_type !== "customer")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return messages[0] ?? null;
  }, [order.order_messages]);

  const visibleHistory = (order.order_status_history ?? [])
    .filter((entry) => entry.customer_visible)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const onUploadAttachment = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "order-message");
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Unable to upload attachment.");
      }

      setAttachmentUrl(result.url);
      toast.success("Attachment uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-white/70 bg-white/80 shadow-card">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Order status
          </p>
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{order.order_number}</span>
            <StatusBadge status={orderStatus} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <OrderProgressTracker status={orderStatus} />
          <div className="rounded-[1.75rem] border border-bakery-gold/20 bg-bakery-gold/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
              Latest update
            </p>
            <h2 className="mt-3 font-serif text-3xl text-foreground">
              {getCustomerOrderStatusLabel(orderStatus)}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {latestVisibleMessage?.message_body || getCustomerOrderStatusMessage(orderStatus)}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 font-medium text-foreground">{order.customer_name}</p>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Payment
              </p>
              <p className="mt-2 font-medium text-foreground">
                {getPaymentStatusLabel(order.payment_status)}
              </p>
              {paymentStatusCopy ? (
                <p className="mt-1 text-xs text-muted-foreground">{paymentStatusCopy}</p>
              ) : null}
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Fulfillment
              </p>
              <p className="mt-2 font-medium capitalize text-foreground">
                {order.fulfillment_method}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Estimated ready
              </p>
              <p className="mt-2 font-medium text-foreground">
                {order.estimated_ready_at
                  ? new Date(order.estimated_ready_at).toLocaleString("en-US")
                  : "We’ll update this soon"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">{order.fulfillment_date}</Badge>
            {order.fulfillment_time_slot ? (
              <Badge variant="outline">{order.fulfillment_time_slot}</Badge>
            ) : null}
            <OrderPushOptInButton orderToken={orderToken} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/70 bg-white/80 shadow-card">
          <CardHeader>
            <CardTitle>Order details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-border px-4 py-4"
              >
                <div>
                  <p className="font-medium text-foreground">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.variant_name ?? "Base"} • Qty {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-foreground">
                  {formatCurrency(item.unit_price * item.quantity)}
                </p>
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

        <div className="space-y-8">
          <Card className="border-white/70 bg-white/80 shadow-card">
            <CardHeader>
              <CardTitle>Messages with L&A Amor & Sugar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
                {(order.order_messages ?? [])
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((message) => {
                    const isCustomer = message.sender_type === "customer";
                    return (
                      <div
                        key={message.id}
                        className={`rounded-[1.5rem] p-4 ${
                          isCustomer
                            ? "bg-secondary/80"
                            : "border border-bakery-gold/20 bg-bakery-gold/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{message.sender_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString("en-US")}
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {message.message_body}
                        </p>
                        {message.attachment_url ? (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-sm text-bakery-rose underline underline-offset-4"
                          >
                            View attachment
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
              <div className="space-y-3 rounded-[1.5rem] border border-border bg-white/70 p-4">
                <div className="space-y-2">
                  <Label htmlFor="message_body">Send a message</Label>
                  <Textarea
                    id="message_body"
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    placeholder="Ask a question or share any details for your order."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment</Label>
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void onUploadAttachment(file);
                      }
                    }}
                  />
                  {attachmentUrl ? (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-bakery-rose underline underline-offset-4"
                    >
                      Attachment uploaded
                    </a>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="gold"
                  disabled={isPending || isUploading || !messageBody.trim()}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await sendCustomerOrderMessageAction({
                        order_token: orderToken,
                        message_body: messageBody.trim(),
                        attachment_url: attachmentUrl || null
                      });

                      if (result.error) {
                        toast.error(result.error);
                        return;
                      }

                      toast.success("Your message has been sent.");
                      window.location.reload();
                    })
                  }
                >
                  Send message
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/80 shadow-card">
            <CardHeader>
              <CardTitle>Order timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleHistory.map((entry) => (
                <div key={entry.id} className="rounded-[1.5rem] border border-border px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {getCustomerOrderStatusLabel(entry.new_status)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("en-US")}
                    </p>
                  </div>
                  {entry.note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
