import type { Route } from "next";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import type { HomepageContentRow, SiteSettingsModel } from "@/lib/types/app";
import { signOutAction } from "@/actions/auth";
import { BrandMark } from "@/components/site/brand-mark";
import { CartButton } from "@/components/site/cart-button";
import { Button } from "@/components/ui/button";

const publicNav = [
  { href: "/shop", label: "Shop by Product" },
  { href: "/menu", label: "Shop by Occasion" },
  { href: "/shop?seasonal=true" as Route, label: "Seasonal" },
  { href: "/treat-designer" as Route, label: "Treat Designer" },
  { href: "/custom-orders", label: "Custom Orders" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export function SiteHeader({
  homepage,
  currentUser,
  currentUserRole,
  settings
}: {
  homepage: HomepageContentRow;
  currentUser: User | null;
  currentUserRole: string | null;
  settings: SiteSettingsModel;
}) {
  const showAdminLink = currentUserRole === "admin" || currentUserRole === "staff";
  const navigation = settings.feature_settings.treat_designer_enabled
    ? publicNav
    : publicNav.filter((item) => item.href !== "/treat-designer");

  return (
    <header data-site-chrome className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(255,250,246,0.86)] backdrop-blur-xl">
      {homepage.banner_text ? (
        <div className="border-b border-bakery-gold/10 bg-bakery-gold/10 px-4 py-3 text-center text-sm text-bakery-espresso">
          <span>{homepage.banner_text}</span>
          {homepage.banner_cta_label && homepage.banner_cta_href ? (
            <a
              href={homepage.banner_cta_href}
              className="ml-3 font-semibold text-bakery-rose transition hover:text-bakery-gold"
            >
              {homepage.banner_cta_label}
            </a>
          ) : null}
        </div>
      ) : null}
      <div className="container flex min-h-28 items-center justify-between gap-6 py-3">
        <BrandMark />
        <nav className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/order-status"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            My Orders
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <CartButton />
          {currentUser ? (
            <>
              <Button asChild variant="outline" className="inline-flex border-bakery-gold/20 bg-white/70 text-bakery-espresso hover:border-bakery-gold/40 hover:bg-bakery-champagne/70">
                <Link href="/order-status">My Orders</Link>
              </Button>
              {showAdminLink ? (
                <Button asChild variant="outline" className="hidden border-bakery-gold/20 bg-bakery-gold/10 text-bakery-espresso hover:border-bakery-gold/40 hover:bg-bakery-champagne/70 md:inline-flex">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <form action={signOutAction} className="hidden md:block">
                <Button type="submit" variant="ghost">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="outline" className="hidden border-bakery-gold/20 bg-white/70 text-bakery-espresso hover:border-bakery-gold/40 hover:bg-bakery-champagne/70 sm:inline-flex">
              <Link href="/account/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="container flex gap-3 overflow-x-auto border-t border-white/60 py-3 text-sm font-medium text-muted-foreground lg:hidden"
      >
        {[
          ...navigation,
          { href: "/order-status" as Route, label: "My Orders" },
          ...(currentUser ? [] : [{ href: "/account/login" as Route, label: "Sign in" }])
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-white/72 px-4 py-2 transition hover:bg-bakery-champagne/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bakery-rose/40"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
