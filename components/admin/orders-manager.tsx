"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/actions/admin";
import type { OrderWithItems } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/site/status-badge";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
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
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US")}
                    </p>
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
                  <span className="text-sm text-muted-foreground">{getPaymentLabel(order)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
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
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
