import Link from "next/link";
import { Instagram, Mail, Phone, Sparkles } from "lucide-react";

import type { SiteSettingsRow } from "@/lib/types/app";
import { BrandMark } from "@/components/site/brand-mark";

export function SiteFooter({ settings }: { settings: SiteSettingsRow }) {
  return (
    <footer className="border-t border-white/60 bg-white/75 backdrop-blur">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-md text-sm text-muted-foreground">
            Premium dessert boxes, dipped berries, cupcakes, and event sweets with a soft luxe feel and family-made care in every detail.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {settings.support_phone}
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {settings.support_email}
            </span>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl text-foreground">Explore</h3>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <Link href="/shop">Shop treats</Link>
            <Link href="/custom-orders">Custom orders</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl text-foreground">Brand Notes</h3>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <p className="inline-flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-bakery-gold" />
              Pickup and delivery options are managed from the admin dashboard and reflected in checkout.
            </p>
            <a
              href={settings.instagram_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Instagram className="h-4 w-4" />
              Follow on Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
