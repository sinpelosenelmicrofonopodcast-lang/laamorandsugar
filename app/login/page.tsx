import { LoginForm } from "@/components/site/login-form";
import { buildMetadata } from "@/lib/config/site";

export const metadata = buildMetadata({
  title: "Team Sign In",
  description: "Secure team access for L&A Amor & Sugar.",
  path: "/login",
  noIndex: true
});

export default function LoginPage() {
  return (
    <div className="container py-16">
      <LoginForm />
    </div>
  );
}
