import { redirect } from "next/navigation";

import { CustomerOrdersHub } from "@/components/site/customer-orders-hub";
import { requireAuthenticatedUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";
import { getOrdersForUser } from "@/lib/data/queries";

export const metadata = buildMetadata({
  title: "My Account",
  description: "View your profile, order history, and live updates from L&A Amor & Sugar.",
  path: "/account"
});

export default async function CustomerAccountPage() {
  const { user, profile } = await requireAuthenticatedUser("/account/login?next=/account");

  if (!user.email) {
    redirect("/account/login?next=/account");
  }

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="container py-16">
      <CustomerOrdersHub profile={profile} email={user.email} orders={orders} />
    </div>
  );
}
