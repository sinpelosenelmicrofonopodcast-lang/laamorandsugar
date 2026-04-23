"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { updateCustomOrderStatusAction } from "@/actions/admin";
import type { CustomOrderRow } from "@/lib/types/app";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statuses = ["new", "reviewing", "quoted", "approved", "declined", "completed"] as const;

export function CustomOrdersManager({ orders }: { orders: CustomOrderRow[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom order requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </div>
                </TableCell>
                <TableCell>{order.event_type}</TableCell>
                <TableCell>{new Date(order.event_date).toLocaleDateString("en-US")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <select
                      className="h-10 rounded-full border border-border bg-white px-3 text-sm"
                      value={order.status}
                      onChange={(event) =>
                        startTransition(async () => {
                          const result = await updateCustomOrderStatusAction({
                            customOrderId: order.id,
                            status: event.target.value
                          });
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Custom order status updated");
                        })
                      }
                      disabled={isPending}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/custom-orders/${order.id}`}>View</Link>
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
