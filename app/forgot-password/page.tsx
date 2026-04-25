import { ForgotPasswordForm } from "@/components/site/forgot-password-form";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Forgot Password",
  description: "Request a secure password reset link for your bakery admin account.",
  path: "/forgot-password"
});

export default function ForgotPasswordPage() {
  return (
    <div className="container py-16">
      <ForgotPasswordForm />
    </div>
  );
}
