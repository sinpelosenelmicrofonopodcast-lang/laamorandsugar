import type { Route } from "next";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import type { HomepageContentRow, SiteSettingsRow } from "@/lib/types/app";
import { signOutAction } from "@/actions/auth";
import { BrandMark } from "@/components/site/brand-mark";
import { CartButton } from "@/components/site/cart-button";
import { Button } from "@/components/ui/button";

const publicNav = [
  { href: "/shop", label: "Shop" },
  { href: "/custom-orders", label: "Custom Orders" },
  { href: "/about", label: "About" },
  { href: "/reviews", label: "Reviews" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export function SiteHeader({
  homepage,
  settings,
  currentUser,
  currentUserRole
}: {
  homepage: HomepageContentRow;
  settings: SiteSettingsRow;
  currentUser: User | null;
  currentUserRole: string | null;
}) {
  const showAdminLink = currentUserRole === "admin" || currentUserRole === "staff";

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(255,250,246,0.86)] backdrop-blur-xl">
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
          {publicNav.map((item) => (
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
              <Button asChild variant="outline" className="inline-flex">
                <Link href="/order-status">My Orders</Link>
              </Button>
              {showAdminLink ? (
                <Button asChild variant="outline" className="hidden md:inline-flex">
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
            <>
              <Button asChild variant="outline" className="inline-flex">
                <Link href="/account/login">Sign in</Link>
              </Button>
              <Button asChild variant="ghost" className="hidden lg:inline-flex">
                <Link href="/login">{settings.business_name === "Admin" ? "Admin" : "Admin Login"}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
