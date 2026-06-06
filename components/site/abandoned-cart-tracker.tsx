"use client";

import { useEffect } from "react";

import { useCartStore } from "@/lib/store/cart-store";

const ANONYMOUS_ID_KEY = "la_cart_anonymous_id";

function getAnonymousId() {
  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, nextId);
  return nextId;
}

export function AbandonedCartTracker() {
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      const subtotal = items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0
      );

      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: getAnonymousId(),
          items,
          subtotal
        })
      }).catch(() => null);
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [items]);

  return null;
}
