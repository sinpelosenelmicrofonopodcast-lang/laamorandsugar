import { MessageCircleHeart } from "lucide-react";

import { getWhatsAppHref } from "@/lib/whatsapp";

export function WhatsAppFloatButton({ phone }: { phone: string | null }) {
  const href = getWhatsAppHref(phone);

  if (!href) {
    return null;
  }

  return (
    <a
      data-site-chrome
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-3 rounded-full border border-white/70 bg-[#25D366] px-5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(37,211,102,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(37,211,102,0.42)]"
    >
      <MessageCircleHeart className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
