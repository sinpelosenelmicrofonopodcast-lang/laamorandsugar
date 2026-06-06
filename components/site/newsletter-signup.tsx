"use client";

import { useState, useTransition } from "react";
import { Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { cn } from "@/lib/utils";

type NewsletterSignupProps = {
  variant?: "section" | "compact";
  className?: string;
};

export function NewsletterSignup({ variant = "section", className }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isPending, startTransition] = useTransition();

  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2rem] border border-bakery-gold/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,247,250,0.9))] shadow-card backdrop-blur",
        isCompact ? "p-5" : "p-6 sm:p-8",
        className
      )}
    >
      <div className={cn("grid gap-5", isCompact ? "" : "lg:grid-cols-[1fr_auto] lg:items-end")}>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-bakery-rose/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-bakery-rose">
            <Sparkles className="h-3.5 w-3.5" />
            Sweet List
          </div>
          <div>
            <h2 className={cn("font-serif text-foreground", isCompact ? "text-2xl" : "text-4xl")}>
              Join our Sweet List
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Get 10% OFF your first order plus sweet updates, new treats, and exclusive promos.
            </p>
          </div>
        </div>

        <form
          className={cn("grid gap-3", isCompact ? "" : "sm:grid-cols-[minmax(0,1fr)_auto]")}
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            setDiscountCode(null);

            startTransition(async () => {
                  const response = await fetch("/api/newsletter/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, turnstileToken })
                  });
                  fetch("/api/analytics/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      event_name: "newsletter_signup_intent",
                      path: window.location.pathname,
                      metadata: { source: variant }
                    }),
                    keepalive: true
                  }).catch(() => null);
              const data = (await response.json()) as {
                error?: string;
                message?: string;
                discount_code?: string;
                discount_used?: boolean;
              };

              if (!response.ok) {
                toast.error(data.error ?? "Unable to subscribe.");
                return;
              }

              setMessage(
                data.message ??
                  "You're in! Check your email for your 10% discount."
              );
              setDiscountCode(data.discount_used ? null : data.discount_code ?? null);
              toast.success(data.message ?? "You're in!");
            });
          }}
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="Email address for Sweet List signup"
              className="h-12 rounded-full border-bakery-gold/20 bg-white/90 pl-11 shadow-sm"
              required
            />
          </div>
          <Button type="submit" variant="gold" disabled={isPending} className="shadow-glow">
            {isPending ? "Sending..." : "Get 10% Off"}
          </Button>
          <div className={cn(isCompact ? "" : "sm:col-span-2")}>
            <TurnstileWidget action="newsletter" onVerify={setTurnstileToken} />
          </div>
        </form>
      </div>

      {message ? (
        <div className="mt-4 rounded-[1.25rem] border border-bakery-gold/20 bg-bakery-gold/10 px-4 py-3 text-sm text-bakery-espresso">
          <p>{message}</p>
          {discountCode ? (
            <p className="mt-2 font-semibold">
              Your code: <span className="tracking-[0.18em]">{discountCode}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
