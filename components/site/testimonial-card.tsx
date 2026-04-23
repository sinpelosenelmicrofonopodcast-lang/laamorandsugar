import { Star } from "lucide-react";

import type { TestimonialRow } from "@/lib/types/app";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialCard({ testimonial }: { testimonial: TestimonialRow }) {
  return (
    <Card className="h-full border-white/70 bg-white/80">
      <CardContent className="flex h-full flex-col gap-6 p-6">
        <div className="flex gap-1 text-bakery-gold">
          {Array.from({ length: testimonial.rating }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="text-base leading-7 text-muted-foreground">“{testimonial.quote}”</p>
        <div className="mt-auto">
          <p className="font-semibold text-foreground">{testimonial.customer_name}</p>
          {testimonial.occasion ? (
            <p className="text-sm text-muted-foreground">{testimonial.occasion}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
