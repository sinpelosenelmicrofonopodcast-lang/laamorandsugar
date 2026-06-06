"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Gift, Image as ImageIcon, Package, Palette, ShoppingBag, Sparkles, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { submitTreatDesignerOrderAction } from "@/actions/store";
import { AddOns } from "@/components/AddOns";
import { DynamicOptions } from "@/components/DynamicOptions";
import { LogoUploader, type UploadedLogo } from "@/components/LogoUploader";
import { PreviewCanvas, type PreviewCanvasHandle } from "@/components/PreviewCanvas";
import { PreviewPanel } from "@/components/PreviewPanel";
import { ProductSelector } from "@/components/ProductSelector";
import { SprinkleSelector } from "@/components/SprinkleSelector";
import { SummaryPanel } from "@/components/SummaryPanel";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getLogoUploadFee, isLogoUploadAddOn } from "@/lib/treat-designer";
import type { TreatDesignerAddOn, TreatDesignerConfig } from "@/lib/types/app";

const steps = [
  "Treat Type",
  "Colors",
  "Decor",
  "Logo / Photo",
  "Packaging",
  "Review"
] as const;

const stepIcons = [Gift, Palette, Sparkles, ImageIcon, Package, ShoppingBag] as const;

const luxuryPresets = [
  {
    name: "Teacher Appreciation",
    description: "Soft ivory, blush, and sweet gift-ready details.",
    match: ["teacher", "apple", "ivory", "blush", "gold"]
  },
  {
    name: "Graduation Gold",
    description: "Warm gold finishes for proud milestone moments.",
    match: ["graduation", "gold", "black", "white"]
  },
  {
    name: "Luxury Pink",
    description: "Romantic blush with polished boutique energy.",
    match: ["pink", "blush", "rose", "vanilla"]
  },
  {
    name: "Coffee Lover Collection",
    description: "Mocha, latte, and creamy neutral inspiration.",
    match: ["coffee", "latte", "mocha", "chocolate"]
  },
  {
    name: "Romantic Luxe",
    description: "Love-note colors for anniversaries and sweet surprises.",
    match: ["love", "red", "pink", "heart"]
  }
];

function slugifyPreset(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const storageKey = "amor-sugar-treat-designer";

type SavedDesignerState = {
  productId: string | null;
  selectedOptions: Record<string, string>;
  selectedAddOnIds: string[];
  selectedSprinkleId: string | null;
  logo: UploadedLogo | null;
  quantity: number;
  customNotes: string;
};

export function TreatDesigner({
  config,
  initialPresetSlug
}: {
  config: TreatDesignerConfig;
  initialPresetSlug?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [productId, setProductId] = useState<string | null>(config.products[0]?.id ?? null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [selectedSprinkleId, setSelectedSprinkleId] = useState<string | null>(null);
  const [logo, setLogo] = useState<UploadedLogo | null>(null);
  const [quantity, setQuantity] = useState(config.products[0]?.min_quantity ?? 6);
  const [customNotes, setCustomNotes] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const previewCanvasRef = useRef<PreviewCanvasHandle | null>(null);
  const initialPresetAppliedRef = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as SavedDesignerState;
      const savedProduct = config.products.find((product) => product.id === parsed.productId);

      if (!savedProduct) {
        return;
      }

      setProductId(savedProduct.id);
      setSelectedOptions(parsed.selectedOptions ?? {});
      setSelectedAddOnIds(parsed.selectedAddOnIds ?? []);
      setSelectedSprinkleId(parsed.selectedSprinkleId ?? null);
      setLogo(parsed.logo ?? null);
      setQuantity(Math.max(savedProduct.min_quantity, parsed.quantity || savedProduct.min_quantity));
      setCustomNotes(parsed.customNotes ?? "");
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [config.products]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        productId,
        selectedOptions,
        selectedAddOnIds,
        selectedSprinkleId,
        logo,
        quantity,
        customNotes
      })
    );
  }, [customNotes, logo, productId, quantity, selectedAddOnIds, selectedOptions, selectedSprinkleId]);

  const product = config.products.find((item) => item.id === productId) ?? null;
  const visibleAddOns = useMemo(
    () =>
      product?.enable_logo_upload
        ? config.addOns.filter((addOn) => !isLogoUploadAddOn(addOn))
        : config.addOns,
    [config.addOns, product?.enable_logo_upload]
  );
  const selectedOptionRows = useMemo(
    () =>
      product
        ? product.option_groups.flatMap((group) =>
            group.options
              .filter((option) => selectedOptions[group.id] === option.id)
              .map((option) => ({
                ...option,
                groupName: group.name
              }))
          )
        : [],
    [product, selectedOptions]
  );
  const selectedAddOns = useMemo(
    () => visibleAddOns.filter((addOn) => selectedAddOnIds.includes(addOn.id)),
    [selectedAddOnIds, visibleAddOns]
  );
  const selectedAddOnPayloadIds = selectedAddOns.map((addOn) => addOn.id);
  const selectedSprinkle =
    config.sprinkleSets.find((sprinkleSet) => sprinkleSet.id === selectedSprinkleId) ?? null;
  const logoUploadFee = product?.enable_logo_upload
    ? getLogoUploadFee(config.addOns, product.logo_upload_fee)
    : 0;
  const totalPrice =
    (product?.base_price ?? 0) * quantity +
    selectedOptionRows.reduce((sum, option) => sum + option.price_modifier, 0) +
    selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0) +
    (product?.enable_sprinkles ? (selectedSprinkle?.price_modifier ?? 0) : 0) +
    (product?.enable_logo_upload && logo ? logoUploadFee : 0);
  const selectedOptionNames = selectedOptionRows.map(
    (option) => `${option.groupName}: ${option.name}`
  );
  const previewImage =
    selectedOptionRows.find((option) => option.image)?.image ?? product?.image ?? null;
  const selectedColors = selectedOptionRows
    .map((option) => option.color_hex)
    .filter((color): color is string => Boolean(color));
  const accentColor = selectedColors[0] ?? null;
  const styleColor = selectedColors[1] ?? selectedColors[0] ?? null;
  const flavorSelection =
    selectedOptionRows.find((option) => option.groupName.toLowerCase().includes("flavor"))?.name ??
    null;
  const colorSelection =
    selectedOptionRows.find((option) =>
      ["color", "finish", "chocolate"].some((label) =>
        option.groupName.toLowerCase().includes(label)
      )
    )?.name ?? null;
  const designConfig = {
    flavor: flavorSelection,
    color: colorSelection,
    sprinkles: product?.enable_sprinkles ? selectedSprinkle : null,
    logo: product?.enable_logo_upload ? logo : null
  };
  const visibleSelectionNames = [
    ...selectedOptionNames,
    product?.enable_sprinkles && selectedSprinkle ? `Sprinkles: ${selectedSprinkle.name}` : null,
    product?.enable_logo_upload && logo ? `Logo: ${logo.fileName}` : null
  ].filter((entry): entry is string => Boolean(entry));
  const colorGroups = product?.option_groups.filter((group) =>
    ["color", "finish", "chocolate", "palette"].some((label) =>
      group.name.toLowerCase().includes(label)
    )
  ) ?? [];
  const decorGroups = product?.option_groups.filter((group) => !colorGroups.some((item) => item.id === group.id)) ?? [];
  const canUploadLogo = Boolean(product?.enable_logo_upload);
  const hasPackagingOptions = visibleAddOns.length > 0;
  const canGoToStep = (index: number) => index <= activeStep || !validateStep(Math.max(0, index - 1));

  function selectProduct(nextProductId: string) {
    const nextProduct = config.products.find((item) => item.id === nextProductId);

    setProductId(nextProductId);
    setSelectedOptions({});
    setSelectedSprinkleId(null);
    setLogo(null);
    setQuantity(nextProduct?.min_quantity ?? 6);
  }

  const applyPreset = useCallback((
    preset: (typeof luxuryPresets)[number],
    options: { silent?: boolean } = {}
  ) => {
    if (!product) {
      return;
    }

    const nextOptions: Record<string, string> = {};

    product.option_groups.forEach((group) => {
      const option =
        group.options.find((item) =>
          preset.match.some((keyword) =>
            `${item.name} ${group.name}`.toLowerCase().includes(keyword)
          )
        ) ?? group.options[0];

      if (option) {
        nextOptions[group.id] = option.id;
      }
    });

    setSelectedOptions(nextOptions);
    setCustomNotes((current) =>
      current || `${preset.name} inspired design with luxury gift-ready presentation.`
    );
    if (!options.silent) {
      toast.success(`${preset.name} loaded`);
    }
  }, [product]);

  useEffect(() => {
    if (initialPresetAppliedRef.current || !initialPresetSlug || !product) {
      return;
    }

    const preset = luxuryPresets.find((item) => slugifyPreset(item.name) === initialPresetSlug);

    if (!preset) {
      return;
    }

    initialPresetAppliedRef.current = true;
    applyPreset(preset, { silent: true });
    setActiveStep(1);
  }, [applyPreset, initialPresetSlug, product]);

  function validateStep(stepIndex = activeStep) {
    if (!product) {
      return "Select a product to begin.";
    }

    if (stepIndex === 1) {
      const groupsToCheck = colorGroups.length > 0 ? colorGroups : product.option_groups;
      const missingGroup = groupsToCheck.find(
        (group) => group.required && !selectedOptions[group.id]
      );

      if (missingGroup) {
        return `Choose ${missingGroup.name} before continuing.`;
      }
    }

    if (stepIndex >= 2) {
      const missingGroup = product.option_groups.find(
        (group) => group.required && !selectedOptions[group.id]
      );

      if (missingGroup) {
        return `Choose ${missingGroup.name} before continuing.`;
      }
    }

    return null;
  }

  function goNext() {
    const validationMessage = validateStep(activeStep);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function uploadPreviewImage(dataUrl: string) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `treat-design-${Date.now()}.png`, { type: "image/png" });
    const body = new FormData();
    body.set("file", file);
    body.set("purpose", "treat-designer-previews");
    body.set("turnstileToken", turnstileToken);

    const uploadResponse = await fetch("/api/media/upload", {
      method: "POST",
      body
    });
    const payload = (await uploadResponse.json()) as { url?: string; error?: string };

    if (!uploadResponse.ok || !payload.url) {
      throw new Error(payload.error ?? "Preview upload failed.");
    }

    return payload.url;
  }

  function submit() {
    const validationMessage = validateStep(steps.length - 1);

    if (validationMessage || !product) {
      toast.error(validationMessage ?? "Select a product to begin.");
      return;
    }

    startTransition(async () => {
      if (config.isMock) {
        toast.success("Preview listo", {
          description: "Tu diseño se guardara cuando activemos las solicitudes personalizadas."
        });
        return;
      }

      let previewImageUrl: string | null = null;
      const previewDataUrl = product.enable_live_preview
        ? previewCanvasRef.current?.exportImage()
        : null;

      if (previewDataUrl) {
        try {
          previewImageUrl = await uploadPreviewImage(previewDataUrl);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Preview upload failed.");
          return;
        }
      }

      const result = await submitTreatDesignerOrderAction({
        productId: product.id,
        selectedOptions: Object.values(selectedOptions).filter(Boolean),
        addOns: selectedAddOnPayloadIds,
        sprinkles: product.enable_sprinkles ? selectedSprinkleId : null,
        logo: product.enable_logo_upload ? logo : null,
        config: designConfig,
        previewImageUrl,
        quantity,
        customNotes,
        totalPrice,
        turnstileToken,
        createdAt: new Date().toISOString()
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      window.localStorage.removeItem(storageKey);
      toast.success("Custom treat request submitted");
      setActiveStep(0);
      setSelectedOptions({});
      setSelectedAddOnIds([]);
      setSelectedSprinkleId(null);
      setLogo(null);
      setCustomNotes("");
      setQuantity(product.min_quantity);
    });
  }

  if (config.products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/86 p-8 text-center shadow-card">
        <h2 className="font-serif text-4xl text-foreground">Designer products are not active yet</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Custom design options are coming soon. For now, send us your idea through a custom order request.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/66 p-3 shadow-card backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3 px-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                Luxury configurator
              </p>
              <h2 className="font-serif text-3xl leading-tight text-foreground">
                Build the moment
              </h2>
            </div>
            <div className="rounded-full bg-bakery-rose/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-bakery-rose">
              Trending in Killeen
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {steps.map((step, index) => {
              const Icon = stepIcons[index];
              const isActive = activeStep === index;
              const isComplete = activeStep > index;

              return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (canGoToStep(index)) {
                    setActiveStep(index);
                  }
                }}
                className={`group flex min-w-0 items-center justify-center gap-2 rounded-full px-3 py-3 text-xs font-semibold transition sm:text-sm ${
                  isActive
                    ? "border border-bakery-gold/30 bg-[linear-gradient(135deg,rgba(216,109,146,0.92),rgba(197,155,69,0.82))] text-white shadow-glow"
                    : isComplete
                      ? "border border-bakery-gold/20 bg-bakery-gold/10 text-bakery-espresso"
                      : "border border-transparent text-muted-foreground hover:border-bakery-gold/20 hover:bg-bakery-champagne/60 hover:text-foreground"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 truncate">{index + 1}. {step}</span>
              </button>
              );
            })}
          </div>
        </div>

        <section className="rounded-[2.25rem] border border-white/80 bg-white/78 p-5 shadow-[0_26px_76px_rgba(120,85,63,0.12)] backdrop-blur-xl sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
                Step {activeStep + 1} of {steps.length}
              </p>
              <h3 className="font-serif text-4xl leading-tight text-foreground">{steps[activeStep]}</h3>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {activeStep === 0
                ? "Choose the treat foundation for your custom gift."
                : activeStep === 1
                  ? "Pick the color palette that sets the whole mood."
                  : activeStep === 2
                    ? "Layer in drizzle, sprinkles, toppings, and decorative finishes."
                    : activeStep === 3
                      ? "Add a logo, edible image, photo, or special note."
                      : activeStep === 4
                        ? "Select quantity, packaging, and premium upgrades."
                        : "Review your luxury treat experience before submitting."}
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
            {activeStep === 0 ? (
              <div className="space-y-7">
                <ProductSelector
                  products={config.products}
                  selectedProductId={productId}
                  onSelect={selectProduct}
                />
                <div className="rounded-[1.75rem] border border-bakery-gold/20 bg-bakery-gold/10 p-5">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-bakery-gold" />
                    <p className="font-serif text-2xl text-foreground">Popular Luxury Designs</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {luxuryPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="rounded-[1.3rem] border border-white/75 bg-white/72 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-bakery-gold/40"
                      >
                        <p className="font-semibold text-foreground">{preset.name}</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            {activeStep === 1 && product ? (
              <div className="space-y-6">
                <DynamicOptions
                  product={product}
                  groups={colorGroups.length > 0 ? colorGroups : product.option_groups}
                  selectedOptions={selectedOptions}
                  onSelect={(groupId, optionId) =>
                    setSelectedOptions((current) => ({ ...current, [groupId]: optionId }))
                  }
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customNotes">
                    Describe your idea, theme, or inspiration
                  </label>
                  <Textarea
                    id="customNotes"
                    value={customNotes}
                    onChange={(event) => setCustomNotes(event.target.value)}
                    placeholder="Share colors, occasion, packaging notes, or inspiration details."
                    className="min-h-28"
                  />
                </div>
              </div>
            ) : null}
            {activeStep === 2 ? (
              <div className="space-y-6">
                {product && decorGroups.length > 0 ? (
                  <DynamicOptions
                    product={product}
                    groups={decorGroups}
                    selectedOptions={selectedOptions}
                    onSelect={(groupId, optionId) =>
                      setSelectedOptions((current) => ({ ...current, [groupId]: optionId }))
                    }
                  />
                ) : null}
                {product?.enable_sprinkles ? (
                  <SprinkleSelector
                    sprinkleSets={config.sprinkleSets}
                    selectedSprinkleId={selectedSprinkleId}
                    onSelect={setSelectedSprinkleId}
                  />
                ) : null}
              </div>
            ) : null}
            {activeStep === 3 ? (
              <div className="space-y-6">
                {canUploadLogo ? (
                  <LogoUploader
                    logo={logo}
                    logoFee={logoUploadFee}
                    turnstileToken={turnstileToken}
                    onChange={setLogo}
                  />
                ) : (
                  <div className="rounded-[1.75rem] border border-white/75 bg-white/78 p-6 text-center shadow-sm">
                    <Wand2 className="mx-auto h-8 w-8 text-bakery-gold" />
                    <h3 className="mt-3 font-serif text-3xl text-foreground">Logo upload is not needed for this treat</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Continue to packaging, or add notes below for a custom message, theme, or edible detail request.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customNotesLogo">
                    Logo placement, photo details, or personal note
                  </label>
                  <Textarea
                    id="customNotesLogo"
                    value={customNotes}
                    onChange={(event) => setCustomNotes(event.target.value)}
                    placeholder="Add names, date, logo placement, edible image notes, packaging message, or inspiration details."
                    className="min-h-28 rounded-[1.4rem] bg-white/88"
                  />
                </div>
              </div>
            ) : null}
            {activeStep === 4 ? (
              <div className="space-y-6">
                {hasPackagingOptions ? (
                  <AddOns
                    addOns={visibleAddOns}
                    selectedAddOnIds={selectedAddOnIds}
                    onToggle={(addOnId) =>
                      setSelectedAddOnIds((current) =>
                        current.includes(addOnId)
                          ? current.filter((id) => id !== addOnId)
                          : [...current, addOnId]
                      )
                    }
                  />
                ) : null}
                <QuantityControl
                  minQuantity={product?.min_quantity ?? 6}
                  quantity={quantity}
                  onChange={setQuantity}
                />
              </div>
            ) : null}
            {activeStep === 5 ? (
              <div className="space-y-4">
                <SummaryPanel
                  product={product}
                  selectedOptionNames={visibleSelectionNames}
                  selectedAddOns={selectedAddOns}
                  quantity={quantity}
                  customNotes={customNotes}
                  totalPrice={totalPrice}
                />
                <TurnstileWidget action="upload" onVerify={setTurnstileToken} />
              </div>
            ) : null}
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-bakery-gold/20 bg-white/70 text-bakery-espresso hover:border-bakery-gold/40 hover:bg-bakery-champagne/70"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button type="button" variant="gold" size="lg" disabled={isPending} onClick={submit}>
              Submit Custom Order
            </Button>
          ) : (
            <Button type="button" variant="gold" size="lg" onClick={goNext}>
              Continue Designing
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
        <div className="sticky top-20 z-20 rounded-[2rem] border border-white/80 bg-white/72 p-3 shadow-card backdrop-blur-xl lg:static lg:p-0 lg:shadow-none lg:bg-transparent lg:border-0">
        {product?.enable_live_preview ? (
          <PreviewCanvas
            ref={previewCanvasRef}
            product={product}
            baseImage={previewImage}
            color={accentColor}
            sprinkleSet={product.enable_sprinkles ? selectedSprinkle : null}
            logo={product.enable_logo_upload ? logo : null}
            onLogoChange={setLogo}
          />
        ) : null}
        </div>
        <PreviewPanel
          product={product}
          previewImage={previewImage}
          accentColor={accentColor}
          styleColor={selectedSprinkle?.color_hex ?? styleColor}
          selectedOptionNames={visibleSelectionNames}
          selectedAddOns={selectedAddOns as TreatDesignerAddOn[]}
          quantity={quantity}
          totalPrice={totalPrice}
        />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bakery-gold/20 bg-white/95 p-3 shadow-[0_-14px_40px_rgba(95,74,65,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{product?.name ?? "Custom treat"}</p>
            <p className="font-serif text-2xl leading-none text-bakery-rose">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalPrice)}
            </p>
          </div>
          {activeStep === steps.length - 1 ? (
            <Button type="button" variant="gold" disabled={isPending} onClick={submit}>
              Submit
            </Button>
          ) : (
            <Button type="button" variant="gold" onClick={goNext}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuantityControl({
  minQuantity,
  quantity,
  onChange
}: {
  minQuantity: number;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const quickQuantities = Array.from(new Set([minQuantity, 6, 12, 24].filter((item) => item >= minQuantity))).sort(
    (left, right) => left - right
  );

  return (
    <div className="rounded-2xl border border-border bg-white/80 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-3xl text-foreground">Quantity</h3>
          <p className="text-sm text-muted-foreground">Minimum {minQuantity}; adjust in increments of 6.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onChange(Math.max(minQuantity, quantity - 6))}
          >
            -
          </Button>
          <span className="w-12 text-center text-xl font-semibold text-foreground">{quantity}</span>
          <Button type="button" variant="outline" size="icon" onClick={() => onChange(quantity + 6)}>
            +
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickQuantities.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              quantity === item ? "bg-bakery-rose text-white" : "bg-secondary text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
