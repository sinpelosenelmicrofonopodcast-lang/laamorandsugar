import { CartView } from "@/components/site/cart-view";
import { SectionHeading } from "@/components/site/section-heading";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Cart",
  description: "Review your selected treats before checkout.",
  path: "/cart"
});

export default function CartPage() {
  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Cart"
        title="Review your sweet selections"
        description="Adjust quantity, remove items, or continue to secure checkout."
      />
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
