"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "la_onesignal_prompt_dismissed_at";
const ENABLED_KEY = "la_onesignal_prompt_enabled";
const DISMISS_DAYS = 14;

type OneSignalClient = {
  Notifications: {
    requestPermission: () => Promise<void>;
    permission?: boolean;
  };
  User?: {
    PushSubscription?: {
      id?: string | null;
    };
    onesignalId?: string | null;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: {
      push: (callback: (OneSignal: OneSignalClient) => void | Promise<void>) => void;
    };
  }
}

function dismissedRecently() {
  const dismissedAt = window.localStorage.getItem(DISMISSED_KEY);

  if (!dismissedAt) {
    return false;
  }

  const elapsed = Date.now() - Number(dismissedAt);
  return Number.isFinite(elapsed) && elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function OneSignalSoftPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const oneSignalEnabled = Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);

  useEffect(() => {
    if (!oneSignalEnabled || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (window.Notification.permission === "granted" || window.Notification.permission === "denied") {
      return;
    }

    if (window.localStorage.getItem(ENABLED_KEY) || dismissedRecently()) {
      return;
    }

    let hasShown = false;
    const show = () => {
      if (hasShown || window.scrollY < 260) {
        return;
      }

      hasShown = true;
      setIsVisible(true);
      window.removeEventListener("scroll", show);
    };
    const timer = window.setTimeout(() => {
      hasShown = true;
      setIsVisible(true);
      window.removeEventListener("scroll", show);
    }, 9000);

    window.addEventListener("scroll", show, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", show);
    };
  }, [oneSignalEnabled]);

  if (!oneSignalEnabled || !isVisible) {
    return null;
  }

  return (
    <div data-site-chrome className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,244,247,0.92))] p-5 shadow-[0_26px_80px_rgba(95,74,65,0.22)] backdrop-blur">
        <button
          type="button"
          aria-label="Dismiss notifications prompt"
          onClick={() => {
            window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
            setIsVisible(false);
          }}
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-bakery-espresso transition hover:bg-bakery-blush/40"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-4 pr-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bakery-gold/15 text-bakery-gold">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-bakery-rose/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-bakery-rose">
              <Sparkles className="h-3.5 w-3.5" />
              Sweet alerts
            </div>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-foreground">
              Don’t Miss Sweet Drops
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Get exclusive treats, limited specials, discounts, and order updates directly to your device.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="gold"
            disabled={isPending}
            className="shadow-glow"
            onClick={() =>
              startTransition(() => {
                if (!window.OneSignalDeferred) {
                  toast.error("Notifications are not ready on this device yet.");
                  return;
                }

                window.OneSignalDeferred.push(async (OneSignal) => {
                  try {
                    await OneSignal.Notifications.requestPermission();
                    const subscriptionId =
                      OneSignal.User?.PushSubscription?.id ?? OneSignal.User?.onesignalId ?? null;

                    if (!subscriptionId) {
                      toast.message("Notifications were not enabled on this device.");
                      return;
                    }

                    window.localStorage.setItem(ENABLED_KEY, "true");
                    await fetch("/api/notifications/push-subscription", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        subscription_id: subscriptionId,
                        source: "soft_prompt"
                      })
                    }).catch(() => null);
                    setIsVisible(false);
                    toast.success("Sweet drops are enabled.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "We could not enable notifications."
                    );
                  }
                });
              })
            }
          >
            {isPending ? "Enabling..." : "Enable Notifications"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
              setIsVisible(false);
            }}
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
