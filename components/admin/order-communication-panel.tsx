"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  sendAdminOrderMessageAction,
  updateCustomerOrderWorkflowAction
} from "@/actions/order-communication";
import { StatusBadge } from "@/components/site/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CUSTOMER_ORDER_STATUS_LABELS,
  type CustomerOrderStatus,
  PAYMENT_STATUSES
} from "@/lib/order-status";
import type { OrderWithItems } from "@/lib/types/app";

const quickReplies = [
  "Thank you! We received your order and will review it shortly.",
  "Your order has been confirmed.",
  "Your order is now being prepared.",
  "Your order is ready for pickup.",
  "Your order is out for delivery.",
  "Your order has been completed.",
  "Please send us any inspiration photos or details for your custom order."
] as const;

export function OrderCommunicationPanel({ order }: { order: OrderWithItems }) {
  const [isPending, startTransition] = useTransition();
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState("");
  const [statusValue, setStatusValue] = useState<CustomerOrderStatus>(
    (order.order_status as CustomerOrderStatus) || "pending_review"
  );
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status ?? "pending");
  const [note, setNote] = useState("");
  const [estimatedReadyAt, setEstimatedReadyAt] = useState(order.estimated_ready_at ?? "");
  const [pickupDate, setPickupDate] = useState(order.pickup_date ?? "");
  const [deliveryDate, setDeliveryDate] = useState(order.delivery_date ?? "");
  const [internalNotes, setInternalNotes] = useState(order.internal_notes ?? "");
  const customerUnreadCount = useMemo(
    () =>
      (order.order_messages ?? []).filter(
        (message) => message.sender_type === "customer" && !message.is_read
      ).length,
    [order.order_messages]
  );

  const uploadAttachment = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "admin");
    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData
    });
    const result = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !result.url) {
      throw new Error(result.error ?? "Unable to upload attachment.");
    }

    setReplyAttachmentUrl(result.url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            <span>Order communication</span>
            <Badge variant="outline">{customerUnreadCount} unread customer messages</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="order_status">Customer-facing status</Label>
            <select
              id="order_status"
              className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value as CustomerOrderStatus)}
            >
              {Object.entries(CUSTOMER_ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment status</Label>
            <select
              id="payment_status"
              className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
            >
              {PAYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_ready_at">Estimated ready time</Label>
            <Input
              id="estimated_ready_at"
              type="datetime-local"
              value={estimatedReadyAt ? estimatedReadyAt.slice(0, 16) : ""}
              onChange={(event) => setEstimatedReadyAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickup_date">Pickup date/time</Label>
            <Input
              id="pickup_date"
              type="datetime-local"
              value={pickupDate ? pickupDate.slice(0, 16) : ""}
              onChange={(event) => setPickupDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery_date">Delivery date/time</Label>
            <Input
              id="delivery_date"
              type="datetime-local"
              value={deliveryDate ? deliveryDate.slice(0, 16) : ""}
              onChange={(event) => setDeliveryDate(event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="note">Customer-visible update</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a short update that the customer should see."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="internal_notes">Internal notes</Label>
            <Textarea
              id="internal_notes"
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              placeholder="Private notes for the team only."
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="button"
              variant="gold"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await updateCustomerOrderWorkflowAction({
                    orderId: order.id,
                    order_status: statusValue,
                    payment_status: paymentStatus,
                    note: note || null,
                    customer_visible: true,
                    estimated_ready_at: estimatedReadyAt || null,
                    pickup_date: pickupDate || null,
                    delivery_date: deliveryDate || null,
                    internal_notes: internalNotes || null
                  });

                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }

                  toast.success("Order update sent.");
                  window.location.reload();
                })
              }
            >
              Send update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick replies</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {quickReplies.map((reply) => (
            <Button
              key={reply}
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await sendAdminOrderMessageAction({
                    orderId: order.id,
                    message_body: reply,
                    attachment_url: null,
                    customer_visible: true
                  });

                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }

                  toast.success("Quick reply sent.");
                  window.location.reload();
                })
              }
            >
              {reply}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message thread</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {(order.order_messages ?? [])
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[1.5rem] p-4 ${
                    message.sender_type === "customer"
                      ? "bg-secondary/80"
                      : message.sender_type === "system"
                        ? "border border-bakery-gold/20 bg-bakery-gold/10"
                        : "bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-foreground">{message.sender_name}</p>
                      <StatusBadge status={message.sender_type} />
                    </div>
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
              ))}
          </div>
          <div className="space-y-3 rounded-[1.5rem] border border-border bg-white/70 p-4">
            <div className="space-y-2">
              <Label htmlFor="reply_body">Reply to customer</Label>
              <Textarea
                id="reply_body"
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Send a customer-visible reply."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply_attachment">Attachment</Label>
              <Input
                id="reply_attachment"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadAttachment(file)
                      .then(() => toast.success("Attachment uploaded."))
                      .catch((error) =>
                        toast.error(
                          error instanceof Error ? error.message : "Upload failed."
                        )
                      );
                  }
                }}
              />
              {replyAttachmentUrl ? (
                <a
                  href={replyAttachmentUrl}
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
              disabled={isPending || !replyBody.trim()}
              onClick={() =>
                startTransition(async () => {
                  const result = await sendAdminOrderMessageAction({
                    orderId: order.id,
                    message_body: replyBody.trim(),
                    attachment_url: replyAttachmentUrl || null,
                    customer_visible: true
                  });

                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }

                  toast.success("Reply sent.");
                  window.location.reload();
                })
              }
            >
              Send reply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
