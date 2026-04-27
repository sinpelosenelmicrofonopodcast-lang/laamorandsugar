/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from "next/navigation";

import { CustomerOrderStatusView } from "@/components/site/customer-order-status-view";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";
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
  const supabase = createAdminClient() as any;
  const [user, role, order] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRole(),
    supabase
      .from("orders")
      .select("*, order_items(*), order_messages(*), order_status_history(*)")
      .eq("order_access_token", token)
      .maybeSingle()
      .then((result: { data: any }) => result.data)
  ]);

  if (!order) {
    notFound();
  }

  if (order.user_id && role !== "admin" && role !== "staff") {
    if (!user) {
      redirect(`/account/login?next=/order-status/${token}`);
    }

    if (user.id !== order.user_id) {
      notFound();
    }
  }

  await supabase
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
