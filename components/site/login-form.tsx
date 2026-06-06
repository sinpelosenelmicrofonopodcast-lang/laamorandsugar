"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { signInAction } from "@/actions/auth";
import { loginSchema } from "@/lib/validations";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState("");
  const searchParams = useSearchParams();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await signInAction({
        ...values,
        turnstileToken
      });

      if (result?.error) {
        toast.error(result.error);
      }
    });
  });

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          Team Access
        </p>
        <CardTitle>Sign in securely</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {searchParams.get("error") === "forbidden" ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            Your account does not have team access yet.
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-bakery-rose">
              Forgot your password?
            </Link>
          </div>
          <TurnstileWidget action="admin_login" onVerify={setTurnstileToken} />
          <Button type="submit" variant="gold" className="w-full" disabled={isPending}>
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
