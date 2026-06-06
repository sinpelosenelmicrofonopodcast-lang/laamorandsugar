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
  const recoveryStateKey = "la-password-recovery-active";
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    let mounted = true;

    const setRecoveryActive = () => {
      window.sessionStorage.setItem(recoveryStateKey, Date.now().toString());
      if (mounted) {
        setStatus("ready");
      }
    };

    const clearRecoveryActive = () => {
      window.sessionStorage.removeItem(recoveryStateKey);
    };

    const hasRecentRecoveryState = () => {
      const value = window.sessionStorage.getItem(recoveryStateKey);

      if (!value) {
        return false;
      }

      const timestamp = Number(value);

      if (!Number.isFinite(timestamp)) {
        clearRecoveryActive();
        return false;
      }

      const maxAgeMs = 30 * 60 * 1000;
      const isFresh = Date.now() - timestamp < maxAgeMs;

      if (!isFresh) {
        clearRecoveryActive();
      }

      return isFresh;
    };

    const checkRecoverySession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const isRecoveryRedirect = url.searchParams.get("recovery") === "1";
      const hasResetError = url.searchParams.has("error");
      const hash = window.location.hash;
      const hasRecoveryHash =
        hash.includes("type=recovery") ||
        (hash.includes("access_token=") && hash.includes("refresh_token="));

      if (hasResetError) {
        clearRecoveryActive();
        window.history.replaceState({}, document.title, "/reset-password");
        setStatus("invalid");
        return;
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if ((error || !data.session) && mounted) {
          clearRecoveryActive();
          setStatus("invalid");
          return;
        }

        setRecoveryActive();
        window.history.replaceState({}, document.title, "/reset-password");
        return;
      }

      if (isRecoveryRedirect) {
        const { data } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (data.session) {
          setRecoveryActive();
          window.history.replaceState({}, document.title, "/reset-password");
          return;
        }

        clearRecoveryActive();
        window.history.replaceState({}, document.title, "/reset-password");
        setStatus("invalid");
        return;
      }

      if (hasRecoveryHash) {
        window.setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (!mounted) {
            return;
          }

          if (data.session) {
            setRecoveryActive();
            window.history.replaceState({}, document.title, "/reset-password");
            return;
          }

          clearRecoveryActive();
          setStatus("invalid");
        }, 500);
        return;
      }

      if (hasRecentRecoveryState()) {
        const { data } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (data.session) {
          setStatus("ready");
          return;
        }

        clearRecoveryActive();
        setStatus("invalid");
        return;
      }

      clearRecoveryActive();
      setStatus("invalid");
    };

    void checkRecoverySession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryActive();
        window.history.replaceState({}, document.title, "/reset-password");
        return;
      }

      if (event === "SIGNED_OUT") {
        clearRecoveryActive();
        setStatus("invalid");
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
        if (error.message.toLowerCase().includes("reauthentication")) {
          window.sessionStorage.removeItem(recoveryStateKey);
          toast.error("Your reset session expired. Please request a new password reset link.");
          setStatus("invalid");
          return;
        }

        toast.error(error.message);
        return;
      }

      window.sessionStorage.removeItem(recoveryStateKey);
      await supabase.auth.signOut();
      toast.success("Password updated");
      router.push("/account/login");
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
