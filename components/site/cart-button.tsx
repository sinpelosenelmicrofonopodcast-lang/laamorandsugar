"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";

export function CartButton() {
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground shadow-sm transition hover:-translate-y-0.5"
      aria-label="View cart"
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-bakery-rose px-1 text-[10px] font-semibold text-white">
        {count}
      </span>
    </Link>
  );
}
