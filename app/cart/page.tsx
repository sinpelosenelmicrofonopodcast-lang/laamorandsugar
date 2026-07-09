import { CartView } from "@/components/site/cart-view";
import { SectionHeading } from "@/components/site/section-heading";
import { buildMetadata } from "@/lib/config/site";
import { getProducts } from "@/lib/data/queries";

export const metadata = buildMetadata({
  title: "Your Dessert Cart",
  description: "Review your selected dessert gifts, add finishing touches, and continue to secure checkout.",
  path: "/cart"
});

export default async function CartPage() {
  const products = await getProducts();
  const recommendedProducts = products
    .filter((product) =>
      [
        product.name,
        product.slug,
        product.categories?.name ?? "",
        product.short_description ?? "",
        product.description
      ]
        .join(" ")
        .toLowerCase()
        .match(/cake pop|oreo|cakesicle|rice krisp|strawberr|dessert box|gift/)
    )
    .slice(0, 4);

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Cart"
        title="Review your sweet selections"
        description="Adjust quantity, remove items, or continue to secure checkout."
        as="h1"
      />
      <div className="mt-10">
        <CartView recommendedProducts={recommendedProducts} />
      </div>
    </div>
  );
}
