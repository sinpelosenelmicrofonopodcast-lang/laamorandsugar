"use client";

import type { TreatDesignerSprinkleSet } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";

export function SprinkleSelector({
  sprinkleSets,
  selectedSprinkleId,
  onSelect
}: {
  sprinkleSets: TreatDesignerSprinkleSet[];
  selectedSprinkleId: string | null;
  onSelect: (sprinkleId: string | null) => void;
}) {
  if (sprinkleSets.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-3xl text-foreground">Sprinkles</h3>
        <p className="text-sm text-muted-foreground">Choose an optional finish for the live preview.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`min-h-24 rounded-[1.4rem] border px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${
            selectedSprinkleId === null
              ? "border-bakery-rose bg-bakery-rose/10 ring-4 ring-bakery-rose/10"
              : "border-white/80 bg-white/82 hover:border-bakery-gold/50 hover:shadow-card"
          }`}
        >
          <span className="block font-medium text-foreground">No sprinkles</span>
          <span className="text-sm text-muted-foreground">Keep it clean and minimal</span>
        </button>
        {sprinkleSets.map((sprinkleSet) => {
          const isSelected = selectedSprinkleId === sprinkleSet.id;

          return (
            <button
              key={sprinkleSet.id}
              type="button"
              onClick={() => onSelect(sprinkleSet.id)}
              className={`flex min-h-24 items-center justify-between gap-4 rounded-[1.4rem] border px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${
                isSelected
                  ? "border-bakery-rose bg-bakery-rose/10 ring-4 ring-bakery-rose/10"
                  : "border-white/80 bg-white/82 hover:border-bakery-gold/50 hover:shadow-card"
              }`}
            >
              <span className="flex items-center gap-3">
                {sprinkleSet.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sprinkleSet.image_url} alt={`${sprinkleSet.name} sprinkle preview`} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span
                    className="h-10 w-10 rounded-full border border-border"
                    style={{ backgroundColor: sprinkleSet.color_hex ?? "#d98ba0" }}
                  />
                )}
                <span>
                  <span className="block font-medium text-foreground">{sprinkleSet.name}</span>
                  {sprinkleSet.price_modifier > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      +{formatCurrency(sprinkleSet.price_modifier)}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className={`h-5 w-5 rounded-full border ${isSelected ? "border-bakery-rose bg-bakery-rose" : "border-border"}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
