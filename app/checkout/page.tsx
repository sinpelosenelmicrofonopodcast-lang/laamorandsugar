import { CheckoutForm } from "@/components/site/checkout-form";
import { SectionHeading } from "@/components/site/section-heading";
import { buildMetadata } from "@/lib/config/site";
import { getAvailablePaymentMethods } from "@/lib/payments";
import { getSiteSettings } from "@/lib/data/queries";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your order with delivery or pickup details, payment selection, and order notes.",
  path: "/checkout"
});

export default function CheckoutPage() {
  const settingsPromise = getSiteSettings();

  return (
    <CheckoutPageContent settingsPromise={settingsPromise} />
  );
}

async function CheckoutPageContent({
  settingsPromise
}: {
  settingsPromise: ReturnType<typeof getSiteSettings>;
}) {
  const settings = await settingsPromise;
  const paymentMethods = getAvailablePaymentMethods(
    settings,
    Boolean(process.env.STRIPE_SECRET_KEY)
  );

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Checkout"
        title="Finalize pickup, delivery, and payment"
        description="Choose your fulfillment details, add notes, and pay using the methods currently available for the shop."
      />
      <div className="mt-10">
        <CheckoutForm settings={settings} paymentMethods={paymentMethods} />
      </div>
    </div>
  );
}
