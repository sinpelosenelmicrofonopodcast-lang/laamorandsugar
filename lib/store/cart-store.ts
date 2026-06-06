"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { z } from "zod";

import { cartItemSchema } from "@/lib/validations";

export type CartItem = z.infer<typeof cartItemSchema>;

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  replaceCart: (items: CartItem[]) => void;
  clearCart: () => void;
};

function getCartKey(item: Pick<CartItem, "productId" | "variantId" | "addons" | "customOptions">) {
  const addonKey = item.addons
    .map((addon) => addon.id)
    .sort()
    .join("-");

  const customOptionsKey = Object.entries(item.customOptions ?? {})
    .filter(([, value]) => value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}-${String(value).slice(0, 80)}`)
    .join("-");

  return [item.productId, item.variantId ?? "base", addonKey, customOptionsKey].join(":");
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = getCartKey(item);
          const existing = state.items.find(
            (cartItem) => getCartKey(cartItem) === key
          );

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                getCartKey(cartItem) === key
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              )
            };
          }

          return {
            items: [...state.items, item]
          };
        }),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => getCartKey(item) !== key)
        })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              getCartKey(item) === key
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
            )
            .filter((item) => item.quantity > 0)
        })),
      replaceCart: (items) => set({ items }),
      clearCart: () => set({ items: [] })
    }),
    {
      name: "la-amor-and-sugar-cart"
    }
  )
);

export function getCartItemKey(item: Pick<CartItem, "productId" | "variantId" | "addons" | "customOptions">) {
  return getCartKey(item);
}
