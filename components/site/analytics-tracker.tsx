"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useCartStore } from "@/lib/store/cart-store";

const ANALYTICS_ID_KEY = "la_analytics_anonymous_id";

function getAnonymousId() {
  const existing = window.localStorage.getItem(ANALYTICS_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(ANALYTICS_ID_KEY, nextId);
  return nextId;
}

function track(event: {
  event_name: string;
  path: string;
  referrer?: string;
  cart_subtotal?: number;
  metadata?: Record<string, unknown>;
}) {
  const payload = JSON.stringify({
    anonymous_id: getAnonymousId(),
    ...event
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => null);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const items = useCartStore((state) => state.items);
  const lastCartSignatureRef = useRef("");
  const pathWithQuery = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    track({
      event_name: "page_view",
      path: pathWithQuery,
      referrer: document.referrer || undefined
    });

    if (pathname.startsWith("/products/")) {
      track({
        event_name: "product_view",
        path: pathWithQuery,
        referrer: document.referrer || undefined,
        metadata: {
          slug: pathname.split("/").filter(Boolean).at(-1) ?? null
        }
      });
    }

    if (pathname === "/checkout") {
      track({
        event_name: "checkout_started",
        path: pathWithQuery,
        referrer: document.referrer || undefined
      });
    }

    if (pathname === "/order-success") {
      track({
        event_name: "order_success",
        path: pathWithQuery,
        referrer: document.referrer || undefined
      });
    }
  }, [pathWithQuery, pathname]);

  useEffect(() => {
    if (items.length === 0) {
      lastCartSignatureRef.current = "";
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const signature = `${items.length}:${subtotal}:${items.map((item) => `${item.productId}:${item.quantity}`).join("|")}`;

    if (lastCartSignatureRef.current === signature) {
      return;
    }

    lastCartSignatureRef.current = signature;
    const timer = window.setTimeout(() => {
      track({
        event_name: "cart_updated",
        path: pathWithQuery,
        cart_subtotal: subtotal,
        metadata: {
          item_count: items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [items, pathWithQuery]);

  return null;
}
