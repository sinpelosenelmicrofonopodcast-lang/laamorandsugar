"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  customerSignUpSchema,
  loginSchema,
  type CustomerSignUpValues
} from "@/lib/validations";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginValues = z.infer<typeof loginSchema>;

function resolveNextPath(searchParams: URLSearchParams) {
  const next = searchParams.get("next");

  if (!next || !next.startsWith("/")) {
    return "/order-status";
  }

  return next;
}

export function CustomerAuthForm({
  mode
}: {
  mode: "login" | "signup";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const nextPath = resolveNextPath(searchParams);
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const signUpForm = useForm<CustomerSignUpValues>({
    resolver: zodResolver(customerSignUpSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleLogin = loginForm.handleSubmit((values) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back.");
      router.push(nextPath as Route);
      router.refresh();
    });
  });

  const handleSignUp = signUpForm.handleSubmit((values) => {
    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/order-status`,
          data: {
            full_name: values.full_name,
            phone: values.phone
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Your account is ready.");
        router.push(nextPath as Route);
        router.refresh();
        return;
      }

      setConfirmationMessage(
        "Your account was created. Please confirm your email, then sign in to continue."
      );
    });
  });

  return (
    <Card className="mx-auto max-w-xl border-white/70 bg-white/85 shadow-card">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          {mode === "login" ? "Customer Sign In" : "Create Your Account"}
        </p>
        <CardTitle>
          {mode === "login" ? "Sign in to place and track orders" : "Create your customer profile"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {confirmationMessage ? (
          <p className="rounded-2xl border border-bakery-gold/20 bg-bakery-gold/10 px-4 py-3 text-sm text-bakery-espresso">
            {confirmationMessage}
          </p>
        ) : null}

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...loginForm.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...loginForm.register("password")} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <Link href="/forgot-password" className="font-medium text-bakery-rose">
                Forgot your password?
              </Link>
              <Link
                href={`/account/sign-up?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-bakery-rose"
              >
                Create account
              </Link>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={isPending}>
              Sign in
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...signUpForm.register("full_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...signUpForm.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup_email">Email</Label>
              <Input id="signup_email" type="email" {...signUpForm.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup_password">Password</Label>
              <Input id="signup_password" type="password" {...signUpForm.register("password")} />
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters with uppercase, lowercase, number, and symbol.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...signUpForm.register("confirmPassword")}
              />
            </div>
            <div className="text-right text-sm">
              <Link
                href={`/account/login?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-bakery-rose"
              >
                Already have an account?
              </Link>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={isPending}>
              Create account
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
