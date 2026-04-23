import type { Route } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { LayoutDashboard, ImageIcon, Layers3, MessageSquareQuote, Package2, Settings, ShoppingBag, Sparkles, Tags, TicketPercent } from "lucide-react";

import { BrandMark } from "@/components/site/brand-mark";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package2 },
  { href: "/admin/categories", label: "Categories", icon: Layers3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: Sparkles },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/homepage", label: "Homepage", icon: Tags },
  { href: "/admin/specials", label: "Seasonal Specials", icon: Sparkles },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings }
] satisfies ReadonlyArray<{ href: Route; label: string; icon: ComponentType<{ className?: string }> }>;

export function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="glass-panel sticky top-28 h-fit rounded-[2rem] border border-white/70 p-4 shadow-card">
      <BrandMark compact />
      <div className="mt-6 grid gap-1">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-bakery-rose text-white shadow-glow"
                  : "text-muted-foreground hover:bg-white/80 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
