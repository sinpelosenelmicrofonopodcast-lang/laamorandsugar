import Link from "next/link";
import { CalendarHeart, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TreatDesignerPaused({ message }: { message?: string | null }) {
  return (
    <div className="container py-16 sm:py-24">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,247,0.86),rgba(197,155,69,0.12))] p-7 text-center shadow-card sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/82 text-bakery-gold shadow-sm">
          <Sparkles className="h-7 w-7" />
        </div>
        <Badge variant="rose" className="mt-6">
          Temporarily paused
        </Badge>
        <h1 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:text-6xl">
          Treat Designer is getting a little polish.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {message ||
            "Treat Designer is temporarily paused while we polish the experience. Please request a custom order and we will help you personally."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg" className="shadow-glow">
            <Link href="/custom-orders">Start Custom Order</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/shop">Shop Ready Treats</Link>
          </Button>
        </div>
        <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-3 rounded-[1.5rem] border border-white/75 bg-white/72 px-5 py-4 text-sm text-bakery-espresso">
          <CalendarHeart className="h-5 w-5 shrink-0 text-bakery-rose" />
          Custom colors, edible logos, packaging, pickup, and local delivery can still be requested by form.
        </div>
      </div>
    </div>
  );
}
