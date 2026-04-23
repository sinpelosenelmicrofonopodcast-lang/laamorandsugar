import { CheckoutForm } from "@/components/site/checkout-form";
import { SectionHeading } from "@/components/site/section-heading";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your order with Stripe checkout, delivery or pickup details, and order notes.",
  path: "/checkout"
});

export default function CheckoutPage() {
  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Secure Checkout"
        title="Finalize pickup, delivery, and payment"
        description="Delivery date selection, notes, and coupon handling are included before redirecting to Stripe."
      />
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </div>
  );
}
