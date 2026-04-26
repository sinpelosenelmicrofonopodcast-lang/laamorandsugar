/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";

import { CustomerOrderStatusView } from "@/components/site/customer-order-status-view";
import { buildMetadata } from "@/lib/config/site";
import { getOrderByAccessToken } from "@/lib/data/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = buildMetadata({
  title: "Your Order Status",
  description:
    "View your L&A Amor & Sugar order progress, messages, and pickup or delivery updates.",
  path: "/order-status"
});

type OrderStatusTokenPageProps = {
  params: Promise<{ token: string }>;
};

export default async function OrderStatusTokenPage({
  params
}: OrderStatusTokenPageProps) {
  const { token } = await params;
  const order = await getOrderByAccessToken(token);

  if (!order) {
    notFound();
  }

  await (createAdminClient() as any)
    .from("order_messages")
    .update({ is_read: true })
    .eq("order_id", order.id)
    .in("sender_type", ["admin", "system"])
    .eq("is_read", false);

  return (
    <div className="container py-16">
      <CustomerOrderStatusView order={order} orderToken={token} />
    </div>
  );
}
