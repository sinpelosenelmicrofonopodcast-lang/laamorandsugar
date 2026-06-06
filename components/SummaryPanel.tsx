"use client";

import type { TreatDesignerAddOn, TreatDesignerProduct } from "@/lib/types/app";
import { getDisplayAddOnName } from "@/lib/treat-designer";
import { formatCurrency } from "@/lib/utils";

export function SummaryPanel({
  product,
  selectedOptionNames,
  selectedAddOns,
  quantity,
  customNotes,
  totalPrice
}: {
  product: TreatDesignerProduct | null;
  selectedOptionNames: string[];
  selectedAddOns: TreatDesignerAddOn[];
  quantity: number;
  customNotes: string;
  totalPrice: number;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/86 p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
        Review My Treat
      </p>
      <div className="mt-5 space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Product</span>
          <span className="font-medium text-foreground">{product?.name ?? "Not selected"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-medium text-foreground">{quantity}</span>
        </div>
        <div>
          <p className="text-muted-foreground">Options</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedOptionNames.length > 0 ? (
              selectedOptionNames.map((name) => (
                <span key={name} className="rounded-full bg-secondary px-3 py-1 text-foreground">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">No options selected yet</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground">Add-ons</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedAddOns.length > 0 ? (
              selectedAddOns.map((addOn) => (
                <span key={addOn.id} className="rounded-full bg-bakery-gold/10 px-3 py-1 text-foreground">
                  {getDisplayAddOnName(addOn.name)}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">No extras selected</span>
            )}
          </div>
        </div>
        {customNotes.trim() ? (
          <div>
            <p className="text-muted-foreground">Notes</p>
            <p className="mt-1 leading-6 text-foreground">{customNotes}</p>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-bakery-gold/20 bg-bakery-gold/10 px-4 py-4">
          <span>
            <span className="block font-medium text-foreground">Estimated Total</span>
            <span className="text-xs text-muted-foreground">Final details confirmed before checkout.</span>
          </span>
          <span className="font-serif text-4xl text-bakery-rose">{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
