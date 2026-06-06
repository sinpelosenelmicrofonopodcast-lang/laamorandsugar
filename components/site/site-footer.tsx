import Link from "next/link";
import { Facebook, Instagram, Mail, MessageCircleHeart, Music2, Phone } from "lucide-react";

import type { SiteSettingsModel } from "@/lib/types/app";
import { BrandMark } from "@/components/site/brand-mark";
import { NewsletterSignup } from "@/components/site/newsletter-signup";
import { getWhatsAppHref } from "@/lib/whatsapp";

export function SiteFooter({ settings }: { settings: SiteSettingsModel }) {
  const whatsappHref = getWhatsAppHref(settings.support_phone);
  const socialLinks = [
    {
      href: settings.instagram_url,
      label: "Follow on Instagram",
      icon: Instagram
    },
    {
      href: settings.facebook_url,
      label: "Follow on Facebook",
      icon: Facebook
    },
    {
      href: settings.tiktok_url,
      label: "Follow on TikTok",
      icon: Music2
    }
  ].filter((link): link is { href: string; label: string; icon: typeof Instagram } => Boolean(link.href));

  return (
    <footer data-site-chrome className="border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,250,246,0.96))] backdrop-blur">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.2fr_0.72fr_0.78fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-md text-sm text-muted-foreground">
            Luxury dessert gifts, chocolate-covered strawberries, custom treats, and dessert boxes made with family care in Killeen, TX.
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
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-[#128C7E] transition hover:text-[#25D366]"
              >
                <MessageCircleHeart className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl text-foreground">Explore</h3>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <Link href="/shop">Shop treats</Link>
            <Link href="/menu">Luxury menu</Link>
            <Link href="/custom-orders">Custom orders</Link>
            {settings.feature_settings.treat_designer_enabled ? (
              <Link href="/treat-designer">Treat Designer</Link>
            ) : null}
            <Link href="/reviews">Reviews</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/policies">Policies</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl text-foreground">Follow Along</h3>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            {socialLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-bakery-rose"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="container pb-12">
        <NewsletterSignup variant="compact" />
      </div>
    </footer>
  );
}
