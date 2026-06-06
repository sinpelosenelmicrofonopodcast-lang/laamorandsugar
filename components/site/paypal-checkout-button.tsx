"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";

import type { CheckoutValues } from "@/lib/validations";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => {
        render: (selectorOrElement: HTMLElement | string) => Promise<void>;
        close?: () => void;
      };
    };
  }
}

type PayPalCheckoutButtonProps = {
  active: boolean;
  amount: number;
  shippingFee?: number;
  preparePayload: () => Promise<(CheckoutValues & { items: CheckoutValues["items"] }) | null>;
  onSuccess: () => void;
};

export function PayPalCheckoutButton({
  active,
  amount,
  shippingFee = 0,
  preparePayload,
  onSuccess
}: PayPalCheckoutButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const serverUrl = process.env.NEXT_PUBLIC_PAYPAL_SERVER_URL?.replace(/\/$/, "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (!active || !sdkReady || !containerRef.current || !window.paypal) {
      return;
    }

    containerRef.current.innerHTML = "";

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          label: "paypal",
          shape: "pill",
          color: "gold",
          height: 48
        },
        createOrder: async () => {
          const payload = await preparePayload();

          if (!payload) {
            throw new Error("Please complete the checkout form first.");
          }

          const response = await fetch(
            serverUrl ? `${serverUrl}/create-order` : "/api/paypal/create-order",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(
                serverUrl
                  ? {
                      amount,
                      shippingFee,
                      description: "L&A Amor & Sugar checkout deposit",
                      customId: payload.customer_email
                    }
                  : payload
              )
            }
          );
          const data = (await response.json()) as { id?: string; error?: string };

          if (!response.ok || !data.id) {
            throw new Error(data.error ?? "Unable to start PayPal checkout.");
          }

          return data.id;
        },
        onApprove: async (data: { orderID?: string }) => {
          const response = await fetch(
            serverUrl
              ? `${serverUrl}/capture-order/${data.orderID}`
              : "/api/paypal/capture-order",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                orderID: data.orderID
              })
            }
          );
          const result = (await response.json()) as {
            success?: boolean;
            redirectUrl?: string;
            transaction?: unknown;
            error?: string;
          };

          if (!response.ok || !result.success) {
            toast.error(result.error ?? "We could not capture your PayPal payment.");
            return;
          }

          onSuccess();

          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
            return;
          }

          toast.success("PayPal payment captured successfully.");
        },
        onCancel: () => {
          toast.message("PayPal checkout was cancelled. Your cart is still here.");
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : "We could not start PayPal checkout.";
          toast.error(message);
        }
      })
      .render(containerRef.current)
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unable to load the PayPal button.";
        toast.error(message);
      });
  }, [active, amount, onSuccess, preparePayload, sdkReady, serverUrl, shippingFee]);

  if (!clientId || !active) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Complete your 50% deposit securely with PayPal.
        </p>
        <div
          ref={containerRef}
          className="min-h-[48px] rounded-[1.5rem] border border-border bg-white/80 p-3"
        />
      </div>
    </>
  );
}
