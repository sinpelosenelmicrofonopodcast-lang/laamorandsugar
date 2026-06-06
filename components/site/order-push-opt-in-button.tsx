"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { saveOrderPushSubscriptionAction } from "@/actions/order-communication";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    OneSignalDeferred?: {
      push: (callback: (OneSignal: OneSignalClient) => void | Promise<void>) => void;
    };
  }
}

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

export function OrderPushOptInButton({ orderToken }: { orderToken: string }) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(false);

  if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending || isEnabled}
      onClick={() =>
        startTransition(() => {
          if (!window.OneSignalDeferred) {
            toast.error("Push notifications are not ready on this device yet.");
            return;
          }

          window.OneSignalDeferred.push(async (OneSignal) => {
            try {
              await OneSignal.Notifications.requestPermission();
              const subscriptionId =
                OneSignal?.User?.PushSubscription?.id ??
                OneSignal?.User?.onesignalId ??
                null;

              if (!subscriptionId) {
                toast.error("We couldn’t enable push notifications on this device.");
                return;
              }

              const result = await saveOrderPushSubscriptionAction({
                order_token: orderToken,
                subscription_id: subscriptionId
              });

              if (result.error) {
                toast.error(result.error);
                return;
              }

              setIsEnabled(true);
              toast.success("Push notifications are enabled for this order.");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "We couldn’t enable push notifications."
              );
            }
          });
        })
      }
    >
      <Bell className="h-4 w-4" />
      {isEnabled ? "Notifications enabled" : "Enable push updates"}
    </Button>
  );
}
