import Link from "next/link";

import { CustomerOrdersHub } from "@/components/site/customer-orders-hub";
import { OrderStatusLookupForm } from "@/components/site/order-status-lookup-form";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";
import { getOrdersForUser } from "@/lib/data/queries";

export const metadata = buildMetadata({
  title: "Order Status",
  description:
    "Check your L&A Amor & Sugar order status, view updates, and message the team about your order.",
  path: "/order-status"
});

export default async function OrderStatusPage() {
  const user = await getCurrentUser();

  if (user?.email) {
    const [profile, orders] = await Promise.all([getCurrentProfile(), getOrdersForUser(user.id)]);

    return (
      <div className="container py-16">
        <CustomerOrdersHub profile={profile} email={user.email} orders={orders} />
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Order tracking
          </p>
          <h1 className="font-serif text-5xl text-foreground sm:text-6xl">
            Keep up with your sweet order
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Sign in to view your customer order hub. If you are checking an older order placed before accounts were required, you can still use the lookup below.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
            <Link href="/account/login?next=/order-status">Sign in to view my orders</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/account/sign-up?next=/checkout">Create account</Link>
          </Button>
        </div>
        <OrderStatusLookupForm />
      </div>
    </div>
  );
}
