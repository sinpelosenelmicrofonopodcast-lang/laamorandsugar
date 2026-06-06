"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  Facebook,
  Gift,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Package,
  Palette,
  Percent,
  ShoppingBag,
  Sparkles,
  Truck
} from "lucide-react";
import { toast } from "sonner";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/config/site";
import type { SiteSettingsModel } from "@/lib/types/app";
import { cn } from "@/lib/utils";
import { getWhatsAppHref } from "@/lib/whatsapp";

const ANALYTICS_ID_KEY = "la_analytics_anonymous_id";

type LinksLandingPageProps = {
  settings: SiteSettingsModel;
};

const quickLinks = [
  {
    label: "Chocolate Covered Strawberries",
    detail: "Our signature collection",
    href: "/collections/strawberry-collection",
    icon: Gift
  },
  {
    label: "Chocolate Covered Oreos",
    detail: "Perfect for gifts and events",
    href: "/collections/chocolate-covered-oreos",
    icon: Sparkles
  },
  {
    label: "Cake Pops",
    detail: "Custom colors and themes",
    href: "/collections/cake-pops",
    icon: Palette
  },
  {
    label: "Treat Boxes",
    detail: "Beautifully packaged sweets",
    href: "/collections/treat-boxes",
    icon: Package
  }
];

function getAnonymousId() {
  const existing = window.localStorage.getItem(ANALYTICS_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(ANALYTICS_ID_KEY, nextId);
  return nextId;
}

function trackLinksEvent(eventName: string, label: string, href?: string) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymous_id: getAnonymousId(),
      event_name: eventName,
      path: window.location.pathname,
      metadata: {
        source: "links_page",
        label,
        href
      }
    }),
    keepalive: true
  }).catch(() => null);
}

function LinkButton({
  href,
  label,
  detail,
  icon: Icon,
  primary = false,
  external = false
}: {
  href: string;
  label: string;
  detail?: string;
  icon: typeof ShoppingBag;
  primary?: boolean;
  external?: boolean;
}) {
  const className = cn(
    "group flex min-h-[64px] w-full items-center gap-3 overflow-hidden rounded-[1.25rem] border px-3.5 py-3 text-left transition duration-200 active:scale-[0.99]",
    primary
      ? "border-bakery-rose bg-bakery-rose text-white shadow-[0_14px_36px_rgba(216,109,146,0.25)] hover:bg-[#cc6288]"
      : "border-bakery-gold/15 bg-white/95 text-bakery-espresso shadow-[0_10px_28px_rgba(95,74,65,0.07)] hover:border-bakery-gold/35"
  );
  const content = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          primary ? "bg-white/18 text-white" : "bg-bakery-blush/40 text-bakery-rose"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold leading-5">{label}</span>
        {detail ? (
          <span className={cn("mt-0.5 block truncate text-xs", primary ? "text-white/80" : "text-muted-foreground")}>
            {detail}
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          primary ? "text-white/85" : "text-bakery-gold"
        )}
      />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={className}
        onClick={() => trackLinksEvent("link_click", label, href)}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href as Route}
      className={className}
      onClick={() => trackLinksEvent("link_click", label, href)}
    >
      {content}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon
}: {
  href: string;
  label: string;
  icon: typeof Instagram;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl border border-bakery-gold/15 bg-white/90 px-2 py-3 text-bakery-espresso shadow-[0_8px_22px_rgba(95,74,65,0.06)] transition hover:border-bakery-rose/30 hover:text-bakery-rose"
      onClick={() => trackLinksEvent("social_click", label, href)}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate text-[11px] font-bold">{label}</span>
    </a>
  );
}

export function LinksLandingPage({ settings }: LinksLandingPageProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isEmailPending, startEmailTransition] = useTransition();
  const phone = settings.support_phone?.replace(/[^\d+]/g, "") || siteConfig.contact.phone;
  const whatsappHref = getWhatsAppHref(settings.support_phone ?? siteConfig.contact.phone);
  const locationHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    settings.address || "L&A Amor and Sugar Killeen TX"
  )}`;

  function openDiscountModal() {
    trackLinksEvent("discount_modal_open", "Get 10% OFF your first order", "/links");
    setEmailModalOpen(true);
  }

  function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setDiscountCode(null);

    startEmailTransition(async () => {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken })
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        discount_code?: string;
        discount_used?: boolean;
      };

      trackLinksEvent("newsletter_signup_intent", "links_discount_modal", "/api/newsletter/subscribe");

      if (!response.ok) {
        toast.error(data.error ?? "Unable to send your discount.");
        return;
      }

      setMessage(data.message ?? "You're in! Check your email for your 10% discount.");
      setDiscountCode(data.discount_used ? null : data.discount_code ?? null);
      toast.success("Sweet. Your discount is ready.");
    });
  }

  return (
    <div data-links-page className="relative min-h-screen overflow-hidden bg-[#fff8f6] px-3 py-4 sm:px-5 sm:py-8">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-bakery-blush/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-52 h-64 w-64 rounded-full bg-bakery-gold/10 blur-3xl" />

      <main className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/55 px-3.5 pb-5 pt-5 shadow-[0_24px_70px_rgba(95,74,65,0.12)] backdrop-blur-sm sm:px-5">
        <header className="text-center">
          <div className="mx-auto h-[76px] w-[156px]">
            <Image
              src="/brand/la-logo-official.png"
              alt="L&A Amor and Sugar"
              width={420}
              height={210}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-1 font-serif text-[1.7rem] leading-tight text-bakery-espresso">
            Made with love, shared with joy
          </h1>
          <p className="mx-auto mt-1.5 max-w-[300px] text-[13px] leading-5 text-muted-foreground">
            Custom treats, sweet gifts, and local delivery in Central Texas.
          </p>
        </header>

        <nav aria-label="Social media" className="mt-4 flex gap-2">
          <SocialLink
            href={settings.instagram_url ?? siteConfig.links.instagram}
            label="Instagram"
            icon={Instagram}
          />
          <SocialLink
            href={settings.tiktok_url ?? siteConfig.links.tiktok}
            label="TikTok"
            icon={Music2}
          />
          <SocialLink
            href={settings.facebook_url ?? siteConfig.links.facebook}
            label="Facebook"
            icon={Facebook}
          />
        </nav>

        <section aria-label="Main links" className="mt-3 space-y-2.5">
          <LinkButton
            href="/shop"
            label="Order Treats Online"
            detail="Browse the full menu"
            icon={ShoppingBag}
            primary
          />
          <LinkButton
            href={settings.feature_settings.treat_designer_enabled ? "/treat-designer" : "/custom-orders"}
            label={settings.feature_settings.treat_designer_enabled ? "Design Your Own Treat" : "Start a Custom Order"}
            detail="Made especially for your occasion"
            icon={Palette}
          />
        </section>

        <button
          type="button"
          onClick={openDiscountModal}
          className="mt-2.5 flex min-h-[56px] w-full items-center gap-3 rounded-[1.15rem] border border-dashed border-bakery-gold/45 bg-bakery-gold/10 px-3.5 py-2.5 text-left text-bakery-espresso transition hover:bg-bakery-gold/15 active:scale-[0.99]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-bakery-gold shadow-sm">
            <Percent className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">Get 10% off your first order</span>
            <span className="block truncate text-[11px] text-muted-foreground">Join our Sweet List</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-bakery-gold" />
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-bakery-gold/20" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-bakery-gold">Shop favorites</p>
          <div className="h-px flex-1 bg-bakery-gold/20" />
        </div>

        <section aria-label="Popular collections" className="space-y-2.5">
          {quickLinks.map((item) => (
            <LinkButton key={item.label} {...item} />
          ))}
        </section>

        <section aria-label="Contact and delivery" className="mt-4 grid grid-cols-3 gap-2">
          <SocialLink
            href={whatsappHref ?? `sms:${phone}`}
            label="WhatsApp"
            icon={MessageCircle}
          />
          <SocialLink href={locationHref} label="Location" icon={MapPin} />
          <SocialLink href="/faq" label="Delivery" icon={Truck} />
        </section>

        <p className="mt-5 text-center text-[11px] font-semibold text-muted-foreground">
          Pickup & local delivery · Killeen, Texas
        </p>
      </main>

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="mx-3 max-w-md border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,244,247,0.96))]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bakery-gold/15 text-bakery-gold">
              <Mail className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center text-3xl">Get 10% OFF your first order</DialogTitle>
            <DialogDescription className="text-center leading-6">
              Join the Sweet List and receive a one-time discount code by email.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={submitEmail}>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              required
              className="h-12 rounded-full bg-white"
            />
            <Button type="submit" variant="gold" disabled={isEmailPending} className="h-12 w-full shadow-glow">
              {isEmailPending ? "Sending..." : "Send My Code"}
            </Button>
            <TurnstileWidget action="newsletter" onVerify={setTurnstileToken} />
          </form>
          {message ? (
            <div className="rounded-[1.25rem] border border-bakery-gold/20 bg-bakery-gold/10 p-4 text-center text-sm text-bakery-espresso">
              <p>{message}</p>
              {discountCode ? (
                <p className="mt-2 font-bold">
                  Code: <span className="tracking-[0.16em]">{discountCode}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
