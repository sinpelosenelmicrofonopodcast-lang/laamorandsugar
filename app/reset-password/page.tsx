import { ResetPasswordForm } from "@/components/site/reset-password-form";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Reset Password",
  description: "Set a new password for your bakery admin account.",
  path: "/reset-password"
});

export default function ResetPasswordPage() {
  return (
    <div className="container py-16">
      <ResetPasswordForm />
    </div>
  );
}
