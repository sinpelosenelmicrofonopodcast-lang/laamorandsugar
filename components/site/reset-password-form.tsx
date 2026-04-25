"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordValues
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      const code = new URL(window.location.href).searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error && mounted) {
          setStatus("invalid");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (data.session) {
        setStatus("ready");
        return;
      }

      const hash = window.location.hash;
      const isRecoveryHash = hash.includes("type=recovery") || hash.includes("access_token=");

      if (isRecoveryHash) {
        window.setTimeout(async () => {
          const { data: delayed } = await supabase.auth.getSession();
          if (!mounted) {
            return;
          }
          setStatus(delayed.session ? "ready" : "invalid");
        }, 400);
        return;
      }

      setStatus("invalid");
    };

    void checkRecoverySession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setStatus("ready");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated");
      router.push("/login");
      router.refresh();
    });
  });

  if (status === "checking") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Checking your reset link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your secure password reset session.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "invalid") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Reset link expired or invalid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Request a new reset email and open the latest link from your inbox.
          </p>
          <Button asChild variant="gold" className="w-full">
            <Link href="/forgot-password">Request new reset link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          Password Reset
        </p>
        <CardTitle>Create your new password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...form.register("password")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
            />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={isPending}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
