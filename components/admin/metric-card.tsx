import { ArrowUpRight } from "lucide-react";

import { formatCompactCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
  currency = false
}: {
  label: string;
  value: number;
  helper: string;
  currency?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </p>
          <ArrowUpRight className="h-4 w-4 text-bakery-gold" />
        </div>
        <p className="mt-4 font-serif text-5xl text-foreground">
          {currency ? formatCompactCurrency(value) : value.toLocaleString("en-US")}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
