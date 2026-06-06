"use client";

import Image from "next/image";

import type { TreatDesignerProduct } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";

export function ProductSelector({
  products,
  selectedProductId,
  onSelect
}: {
  products: TreatDesignerProduct[];
  selectedProductId: string | null;
  onSelect: (productId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map((product) => {
        const isSelected = selectedProductId === product.id;

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product.id)}
            className={`group overflow-hidden rounded-[1.9rem] border bg-white/90 text-left shadow-card transition duration-300 hover:-translate-y-1 ${
              isSelected ? "border-bakery-gold ring-4 ring-bakery-gold/15" : "border-white/80 hover:border-bakery-gold/30 hover:shadow-[0_28px_76px_rgba(120,85,63,0.14)]"
            }`}
          >
            <div className="relative aspect-[1.35/1] overflow-hidden bg-bakery-champagne/70">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.05]"
                />
              ) : (
                <ProductMockup productName={product.name} />
              )}
              <div className="absolute left-4 top-4 rounded-full bg-white/86 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-bakery-gold shadow-sm">
                {product.treat_designer_featured ? "Luxury favorite" : "Customizable"}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-3xl text-foreground">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Minimum {product.min_quantity} pieces
                  </p>
                </div>
                <p className="rounded-full border border-bakery-gold/20 bg-bakery-gold/10 px-3 py-1 text-sm font-semibold text-bakery-gold">
                  {formatCurrency(product.base_price)}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProductMockup({ productName }: { productName: string }) {
  const isCakesicle = productName.toLowerCase().includes("cakesicle");

  return (
    <svg viewBox="0 0 520 335" role="img" aria-label={`${productName} mockup`} className="h-full w-full">
      <defs>
        <radialGradient id={`product-bg-${productName}`} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fffaf5" />
          <stop offset="100%" stopColor="#f8d9dd" />
        </radialGradient>
      </defs>
      <rect width="520" height="335" fill={`url(#product-bg-${productName})`} />
      <circle cx="418" cy="68" r="48" fill="#fff" opacity="0.45" />
      {isCakesicle ? (
        <>
          <line x1="260" y1="196" x2="260" y2="292" stroke="#d8b9a2" strokeWidth="18" strokeLinecap="round" />
          <rect x="200" y="60" width="120" height="174" rx="60" fill="#e6a1ad" />
          <path d="M218 132 C248 152 276 152 304 132" stroke="#c59b45" strokeWidth="7" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="260" y1="190" x2="260" y2="292" stroke="#d8b9a2" strokeWidth="15" strokeLinecap="round" />
          <circle cx="260" cy="130" r="76" fill="#f4b6c4" />
          <rect x="224" y="86" width="24" height="7" rx="3.5" fill="#c59b45" transform="rotate(22 224 86)" />
          <rect x="286" y="124" width="24" height="7" rx="3.5" fill="#c59b45" transform="rotate(-30 286 124)" />
          <rect x="238" y="166" width="24" height="7" rx="3.5" fill="#fff8ef" transform="rotate(25 238 166)" />
        </>
      )}
      <text x="260" y="312" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fill="#6b4d48">
        {productName}
      </text>
    </svg>
  );
}
