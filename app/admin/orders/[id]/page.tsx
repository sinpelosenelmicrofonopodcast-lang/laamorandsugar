import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/site/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById } from "@/lib/data/queries";
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

  return (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
