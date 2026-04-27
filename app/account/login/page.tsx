import type { Route } from "next";
import { redirect } from "next/navigation";

import { CustomerAuthForm } from "@/components/site/customer-auth-form";
import { getCurrentUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Customer Sign In",
  description: "Sign in to place orders, track updates, and message L&A Amor & Sugar about your treats.",
  path: "/account/login"
});

type CustomerLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CustomerLoginPage({
  searchParams
}: CustomerLoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect(
      (params.next && params.next.startsWith("/") ? params.next : "/order-status") as Route
    );
  }

  return (
    <div className="container py-16">
      <CustomerAuthForm mode="login" />
    </div>
  );
}
