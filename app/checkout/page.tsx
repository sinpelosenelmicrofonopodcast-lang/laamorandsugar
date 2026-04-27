import { CheckoutForm } from "@/components/site/checkout-form";
import { SectionHeading } from "@/components/site/section-heading";
import { requireAuthenticatedUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";
import { getAvailablePaymentMethods } from "@/lib/payments";
import { hasPayPalLiveEnv } from "@/lib/paypal";
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
  const [{ user, profile }, settings] = await Promise.all([
    requireAuthenticatedUser("/account/login?next=/checkout"),
    settingsPromise
  ]);
  const paymentMethods = getAvailablePaymentMethods(
    settings,
    Boolean(process.env.STRIPE_SECRET_KEY),
    hasPayPalLiveEnv()
  );

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Checkout"
        title="Finalize pickup, delivery, and payment"
        description="Your account keeps every order, update, and message in one place. Confirm your details below and finish your order."
      />
      <div className="mt-10">
        <CheckoutForm
          settings={settings}
          paymentMethods={paymentMethods}
          customerProfile={profile}
          customerEmail={user.email ?? ""}
        />
      </div>
    </div>
  );
}
