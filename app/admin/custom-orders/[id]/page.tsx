import Image from "next/image";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/site/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomOrderById } from "@/lib/data/queries";

type AdminCustomOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomOrderDetailPage({
  params
}: AdminCustomOrderDetailPageProps) {
  const { id } = await params;
  const order = await getCustomOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{order.customer_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <p>{order.email}</p>
            <p>{order.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Event</p>
            <p>{order.event_type}</p>
            <p>{order.event_date}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quantity / Budget</p>
            <p>{order.quantity}</p>
            <p>{order.budget ? `$${order.budget}` : "Budget not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Theme</p>
            <p>{order.colors_theme ?? "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Notes</p>
            <p>{order.notes ?? "No notes"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">{order.description}</p>
          {order.inspiration_image_url ? (
            <div className="relative aspect-[1/0.78] overflow-hidden rounded-[1.75rem] border border-border">
              <Image
                src={order.inspiration_image_url}
                alt={order.customer_name}
                fill
                className="object-cover"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
