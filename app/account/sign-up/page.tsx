import type { Route } from "next";
import { redirect } from "next/navigation";

import { CustomerAuthForm } from "@/components/site/customer-auth-form";
import { getCurrentUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Create Account",
  description: "Create your customer profile to place orders, track progress, and message L&A Amor & Sugar.",
  path: "/account/sign-up"
});

type CustomerSignUpPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CustomerSignUpPage({
  searchParams
}: CustomerSignUpPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect(
      (params.next && params.next.startsWith("/") ? params.next : "/order-status") as Route
    );
  }

  return (
    <div className="container py-16">
      <CustomerAuthForm mode="signup" />
    </div>
  );
}
