import { LoginForm } from "@/components/site/login-form";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Admin Login",
  description: "Sign in to manage products, orders, content, and business settings.",
  path: "/login"
});

export default function LoginPage() {
  return (
    <div className="container py-16">
      <LoginForm />
    </div>
  );
}
