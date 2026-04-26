import { OrderStatusLookupForm } from "@/components/site/order-status-lookup-form";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Order Status",
  description:
    "Check your L&A Amor & Sugar order status, view updates, and message the team about your order.",
  path: "/order-status"
});

export default function OrderStatusPage() {
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
            Enter your order number and the email or phone number used at checkout to view your order status and messages.
          </p>
        </div>
        <OrderStatusLookupForm />
      </div>
    </div>
  );
}
