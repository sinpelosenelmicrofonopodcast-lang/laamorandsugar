"use client";

import type { TreatDesignerAddOn } from "@/lib/types/app";
import { getDisplayAddOnName } from "@/lib/treat-designer";
import { formatCurrency } from "@/lib/utils";

export function AddOns({
  addOns,
  selectedAddOnIds,
  onToggle
}: {
  addOns: TreatDesignerAddOn[];
  selectedAddOnIds: string[];
  onToggle: (addOnId: string) => void;
}) {
  if (addOns.length === 0) {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-sm text-muted-foreground">
        No extras are active right now.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-3xl text-foreground">Packaging & premium upgrades</h3>
        <p className="text-sm text-muted-foreground">
          Add gift-ready finishes, rush details, packaging upgrades, or presentation extras.
        </p>
      </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {addOns.map((addOn) => {
        const isSelected = selectedAddOnIds.includes(addOn.id);

        return (
          <button
            key={addOn.id}
            type="button"
            onClick={() => onToggle(addOn.id)}
            className={`group flex min-h-24 items-center justify-between rounded-[1.4rem] border px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${
              isSelected
                ? "border-bakery-gold bg-[linear-gradient(135deg,rgba(197,155,69,0.14),rgba(248,217,221,0.14))] ring-4 ring-bakery-gold/10"
                : "border-white/80 bg-white/82 hover:border-bakery-gold/50 hover:shadow-card"
            }`}
          >
            <span>
              <span className="block font-medium text-foreground">{getDisplayAddOnName(addOn.name)}</span>
              <span className="text-sm text-muted-foreground">+{formatCurrency(addOn.price)}</span>
            </span>
            <span
              className={`h-5 w-5 rounded-full border ${
                isSelected ? "border-bakery-gold bg-bakery-gold" : "border-border"
              }`}
            />
          </button>
        );
      })}
    </div>
    </section>
  );
}
