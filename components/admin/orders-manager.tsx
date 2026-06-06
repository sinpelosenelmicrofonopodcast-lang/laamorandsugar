"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/actions/admin";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { getOrderPaymentStatusCopy } from "@/lib/order-payments";
import type { OrderWithItems } from "@/lib/types/app";
import { getCustomerOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-status";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/site/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statuses = ["pending", "confirmed", "in_progress", "ready", "delivered", "canceled"] as const;

function getPaymentLabel(order: OrderWithItems) {
  if (order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)) {
    const paymentLabel = (order.metadata as { payment_label?: string | null }).payment_label;
    if (paymentLabel) {
      return paymentLabel;
    }
  }

  return order.stripe_checkout_session_id ? "Stripe" : "Pending";
}

export function OrdersManager({ orders }: { orders: OrderWithItems[] }) {
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");
  const [unreadFilter, setUnreadFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest_order");

  const filteredOrders = useMemo(() => {
    const next = [...orders].filter((order) => {
      const customerStatus = order.order_status ?? order.status;
      const hasUnreadCustomerMessages = (order.order_messages ?? []).some(
        (message) => message.sender_type === "customer" && !message.is_read
      );

      if (statusFilter !== "all" && customerStatus !== statusFilter) {
        return false;
      }

      if (unreadFilter === "unread_only" && !hasUnreadCustomerMessages) {
        return false;
      }

      return true;
    });

    next.sort((a, b) => {
      if (sortMode === "newest_message") {
        const aTime = Math.max(
          new Date(a.last_customer_message_at ?? 0).getTime(),
          new Date(a.last_admin_message_at ?? 0).getTime(),
          new Date(a.created_at).getTime()
        );
        const bTime = Math.max(
          new Date(b.last_customer_message_at ?? 0).getTime(),
          new Date(b.last_admin_message_at ?? 0).getTime(),
          new Date(b.created_at).getTime()
        );

        return bTime - aTime;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return next;
  }, [orders, sortMode, statusFilter, unreadFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex flex-wrap gap-3">
          <select
            className="h-10 rounded-full border border-border bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="confirmed">Confirmed</option>
            <option value="payment_pending">Payment pending</option>
            <option value="paid">Paid</option>
            <option value="in_progress">In progress</option>
            <option value="ready_for_pickup">Ready for pickup</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="h-10 rounded-full border border-border bg-white px-3 text-sm"
            value={unreadFilter}
            onChange={(event) => setUnreadFilter(event.target.value)}
          >
            <option value="all">All messages</option>
            <option value="unread_only">Unread customer messages</option>
          </select>
          <select
            className="h-10 rounded-full border border-border bg-white px-3 text-sm"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
          >
            <option value="newest_order">Newest order</option>
            <option value="newest_message">Newest message</option>
          </select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const unreadCustomerCount = (order.order_messages ?? []).filter(
                (message) => message.sender_type === "customer" && !message.is_read
              ).length;
              const paymentStatusCopy = getOrderPaymentStatusCopy(order);

              return (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US")}
                    </p>
                    {unreadCustomerCount > 0 ? (
                      <Badge variant="rose" className="mt-2">
                        {unreadCustomerCount} unread
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{getPaymentLabel(order)}</span>
                    <p className="text-xs text-muted-foreground">
                      {getPaymentStatusLabel(order.payment_status)}
                    </p>
                    {paymentStatusCopy ? (
                      <p className="text-xs text-muted-foreground">{paymentStatusCopy}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <StatusBadge status={order.order_status ?? order.status} />
                      <p className="text-xs text-muted-foreground">
                        {getCustomerOrderStatusLabel(order.order_status ?? order.status)}
                      </p>
                    </div>
                    <select
                      className="h-10 rounded-full border border-border bg-white px-3 text-sm"
                      value={order.status}
                      onChange={(event) =>
                        startTransition(async () => {
                          const result = await updateOrderStatusAction({
                            orderId: order.id,
                            status: event.target.value
                          });
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Order status updated");
                        })
                      }
                      disabled={isPending}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                  <DeleteOrderButton orderId={order.id} orderNumber={order.order_number} />
                  </div>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
