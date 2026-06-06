import type { TreatDesignerAddOn } from "@/lib/types/app";

const logoAddOnPattern = /(logo|image|artwork|edible)/i;

export function isLogoUploadAddOn(addOn: Pick<TreatDesignerAddOn, "name">) {
  return logoAddOnPattern.test(addOn.name);
}

export function getDisplayAddOnName(name: string) {
  return isLogoUploadAddOn({ name }) ? "Custom Edible Logo" : name;
}

export function getLogoUploadFee(
  addOns: Pick<TreatDesignerAddOn, "name" | "price">[],
  fallbackFee: number
) {
  const logoAddOn = addOns.find(isLogoUploadAddOn);

  return logoAddOn ? Number(logoAddOn.price ?? 0) : Number(fallbackFee ?? 0);
}
