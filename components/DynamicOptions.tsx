"use client";

import type { TreatDesignerProduct } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";

export function DynamicOptions({
  product,
  groups,
  selectedOptions,
  onSelect
}: {
  product: TreatDesignerProduct;
  groups?: TreatDesignerProduct["option_groups"];
  selectedOptions: Record<string, string>;
  onSelect: (groupId: string, optionId: string) => void;
}) {
  const visibleGroups = groups ?? product.option_groups;

  return (
    <div className="space-y-6">
      {visibleGroups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-serif text-3xl text-foreground">{group.name}</h3>
            {group.required ? (
              <span className="rounded-full bg-bakery-rose/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-bakery-rose">
                Required
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.options.map((option) => {
              const isSelected = selectedOptions[group.id] === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(group.id, option.id)}
                  className={`group flex min-h-24 items-center justify-between gap-4 rounded-[1.35rem] border px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-bakery-rose bg-[linear-gradient(135deg,rgba(216,109,146,0.13),rgba(197,155,69,0.1))] ring-4 ring-bakery-rose/10"
                      : "border-white/80 bg-white/82 hover:border-bakery-gold/50 hover:shadow-card"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {option.color_hex ? (
                      <span
                        className="h-11 w-11 rounded-full border border-white/80 shadow-[inset_0_6px_12px_rgba(255,255,255,0.45),0_8px_18px_rgba(95,74,65,0.14)]"
                        style={{ backgroundColor: option.color_hex }}
                      />
                    ) : null}
                    <span>
                      <span className="block font-medium text-foreground">{option.name}</span>
                      {option.price_modifier > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          +{formatCurrency(option.price_modifier)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={`h-5 w-5 rounded-full border ${
                      isSelected ? "border-bakery-rose bg-bakery-rose" : "border-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
