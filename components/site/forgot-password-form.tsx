"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { requestPasswordResetAction } from "@/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      form.reset();
    });
  });

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
          Password Reset
        </p>
        <CardTitle>Forgot your password?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm leading-6 text-muted-foreground">
          Enter the email tied to your bakery admin account and we will send you a secure reset link.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={isPending}>
            Send reset link
          </Button>
        </form>
        <Link href="/login" className="block text-center text-sm font-medium text-bakery-rose">
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
