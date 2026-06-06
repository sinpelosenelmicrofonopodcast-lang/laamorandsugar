"use client";


import type { TreatDesignerAddOn, TreatDesignerProduct } from "@/lib/types/app";
import { getDisplayAddOnName } from "@/lib/treat-designer";
import { formatCurrency } from "@/lib/utils";

export function PreviewPanel({
  product,
  previewImage,
  accentColor,
  styleColor,
  selectedOptionNames,
  selectedAddOns,
  quantity,
  totalPrice
}: {
  product: TreatDesignerProduct | null;
  previewImage: string | null;
  accentColor: string | null;
  styleColor: string | null;
  selectedOptionNames: string[];
  selectedAddOns: TreatDesignerAddOn[];
  quantity: number;
  totalPrice: number;
}) {
  return (
    <aside className="h-fit rounded-[2rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,248,244,0.88))] p-5 shadow-card backdrop-blur">
      <div
          key={product?.id ?? "empty"}
          className="space-y-5"
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-bakery-gold/10 bg-bakery-champagne/60 shadow-sm">
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt={product?.name ?? "Treat preview"} className="aspect-square w-full object-cover" />
            ) : (
              <TreatMockup
                productName={product?.name ?? "Design Your Treat"}
                accentColor={accentColor ?? "#f4b6c4"}
                styleColor={styleColor ?? "#c59b45"}
              />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              Live Preview
            </p>
            <h2 className="mt-2 font-serif text-4xl leading-tight text-foreground">
              {product?.name ?? "Choose a treat"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Final product details update as you personalize your treat.
            </p>
          </div>
          <div className="space-y-2 rounded-[1.5rem] border border-white/70 bg-white/62 p-4 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Quantity:</span> {quantity}</p>
            {selectedOptionNames.map((name) => (
              <p key={name}>{name}</p>
            ))}
            {selectedAddOns.map((addOn) => (
              <p key={addOn.id}>{getDisplayAddOnName(addOn.name)}</p>
            ))}
          </div>
          <div
            key={totalPrice}
            className="rounded-[1.65rem] border border-bakery-gold/20 bg-[linear-gradient(135deg,rgba(197,155,69,0.16),rgba(248,217,221,0.22),rgba(255,255,255,0.82))] px-5 py-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">Estimated Total</p>
            <p className="mt-1 font-serif text-5xl leading-none text-bakery-rose">{formatCurrency(totalPrice)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Final details confirmed before checkout.</p>
          </div>
        </div>
    </aside>
  );
}

function TreatMockup({
  productName,
  accentColor,
  styleColor
}: {
  productName: string;
  accentColor: string;
  styleColor: string;
}) {
  const isCakesicle = productName.toLowerCase().includes("cakesicle");

  return (
    <svg viewBox="0 0 420 420" role="img" aria-label={`${productName} mockup`} className="aspect-square w-full">
      <defs>
        <radialGradient id="mock-bg" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff8f0" />
          <stop offset="55%" stopColor="#fff1f4" />
          <stop offset="100%" stopColor="#f5ded7" />
        </radialGradient>
        <radialGradient id="treat-gloss" cx="36%" cy="26%" r="64%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.44" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="mock-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#7b4b44" floodOpacity="0.24" />
        </filter>
      </defs>
      <rect width="420" height="420" fill="url(#mock-bg)" />
      <circle cx="340" cy="86" r="56" fill="#fff" opacity="0.45" />
      <circle cx="76" cy="336" r="86" fill="#ffffff" opacity="0.3" />
      <ellipse cx="210" cy="334" rx="82" ry="18" fill="#7b4b44" opacity="0.12" />
      {isCakesicle ? (
        <>
          <line x1="210" y1="266" x2="210" y2="374" stroke="#d8b9a2" strokeWidth="22" strokeLinecap="round" />
          <rect x="122" y="62" width="176" height="248" rx="88" fill={accentColor} filter="url(#mock-shadow)" />
          <rect x="122" y="62" width="176" height="248" rx="88" fill="url(#treat-gloss)" />
          <path d="M155 126 C196 102 232 102 270 126" stroke="#fff" strokeWidth="9" opacity="0.34" strokeLinecap="round" />
          <path d="M142 196 C180 226 242 226 280 196" stroke={styleColor} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M144 222 C184 252 242 252 278 222" stroke={styleColor} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.9" />
        </>
      ) : (
        <>
          <line x1="210" y1="246" x2="210" y2="374" stroke="#d8b9a2" strokeWidth="18" strokeLinecap="round" />
          <circle cx="210" cy="158" r="108" fill={accentColor} filter="url(#mock-shadow)" />
          <circle cx="210" cy="158" r="108" fill="url(#treat-gloss)" />
          <circle cx="172" cy="116" r="18" fill="#fff" opacity="0.22" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
            const points = [
              [156, 84],
              [232, 82],
              [268, 132],
              [140, 166],
              [278, 184],
              [178, 214],
              [230, 226],
              [112, 126]
            ][index];

            return (
              <rect
                key={index}
                x={points[0]}
                y={points[1]}
                width="28"
                height="8"
                rx="4"
                fill={styleColor}
                transform={`rotate(${index % 2 === 0 ? 24 : -34} ${points[0]} ${points[1]})`}
              />
            );
          })}
        </>
      )}
      <text x="210" y="394" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#6b4d48">
        Amor &amp; Sugar
      </text>
    </svg>
  );
}
