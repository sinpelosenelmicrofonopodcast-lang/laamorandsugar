import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById } from "@/lib/data/queries";
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
            Thank you for your order. We have saved your fulfillment details and will keep the order updated from the bakery dashboard.
          </p>
          {order ? (
            <div className="rounded-[1.75rem] bg-secondary/70 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
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
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="gold">
              <Link href="/shop">Continue shopping</Link>
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
