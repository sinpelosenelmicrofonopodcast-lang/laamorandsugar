import type { ProductWithRelations } from "@/lib/types/app";
import { resolveImageUrl } from "@/lib/utils";

const FALLBACK_DESCRIPTION =
  "A gift-ready sweet moment, handcrafted for birthdays, events, teacher gifts, and custom celebrations.";

function getCustomOptions(product: ProductWithRelations) {
  return product.custom_options && typeof product.custom_options === "object" && !Array.isArray(product.custom_options)
    ? (product.custom_options as Record<string, unknown>)
    : {};
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim())
    : [];
}

export function getProductPrimaryImage(product: ProductWithRelations) {
  return (
    resolveImageUrl(product.product_images.find((image) => image.is_primary)) ??
    resolveImageUrl(product.product_images[0]) ??
    (typeof product.image === "string" && product.image.trim().length > 0 ? product.image : null)
  );
}

export function getProductStartingPrice(product: ProductWithRelations) {
  return (
    product.product_variants.find((variant) => variant.is_default)?.price ??
    product.product_variants[0]?.price ??
    product.base_price
  );
}

export function getProductDescription(product: ProductWithRelations) {
  return product.short_description ?? product.description ?? FALLBACK_DESCRIPTION;
}

export function getProductAvailableStock(product: ProductWithRelations) {
  if (typeof product.stock_quantity === "number") {
    return product.stock_quantity;
  }

  const variantStocks = product.product_variants
    .map((variant) => variant.stock_quantity)
    .filter((stock): stock is number => typeof stock === "number");

  if (variantStocks.length > 0) {
    return variantStocks.reduce((total, stock) => total + stock, 0);
  }

  return null;
}

export function getProductStockState(product: ProductWithRelations) {
  const stock = getProductAvailableStock(product);

  if (stock === 0) {
    return {
      stock,
      badge: "SOLD OUT",
      message: "This item is currently sold out."
    };
  }

  if (typeof stock === "number" && stock > 0 && stock < 10) {
    return {
      stock,
      badge: `ONLY ${stock} LEFT`,
      message: `Only ${stock} left. Order now before this sweet pick sells out.`
    };
  }

  return {
    stock,
    badge: null,
    message: null
  };
}

export function getProductBadges(product: ProductWithRelations) {
  const stockBadge = getProductStockState(product).badge;
  const customOptions = getCustomOptions(product);
  const adminBadges = getStringArray(
    customOptions.badges ?? customOptions.tags ?? customOptions.productBadges
  ).map((badge) => badge.toUpperCase());
  const optionalTag =
    typeof (product as ProductWithRelations & { tag?: unknown }).tag === "string"
      ? ((product as ProductWithRelations & { tag?: string }).tag ?? "").trim().toUpperCase()
      : "";

  return [
    stockBadge ?? "",
    ...adminBadges,
    optionalTag,
    product.featured ? "BEST SELLER" : "",
    product.seasonal ? "SEASONAL" : "",
    product.treat_designer_featured ? "CUSTOMIZABLE" : ""
  ]
    .filter(Boolean)
    .filter((badge, index, allBadges) => allBadges.indexOf(badge) === index)
    .slice(0, 4);
}

export function getProductPerfectFor(product: ProductWithRelations) {
  const customOptions = getCustomOptions(product);
  const adminOccasions = getStringArray(
    customOptions.perfectFor ?? customOptions.occasions ?? customOptions.giftOccasions
  );
  const category = product.categories?.name.toLowerCase() ?? "";
  const searchable = `${product.name} ${product.short_description ?? ""} ${product.description ?? ""} ${category}`.toLowerCase();
  const inferred = [
    searchable.includes("teacher") ? "Teacher appreciation" : "",
    searchable.includes("grad") ? "Graduations" : "",
    searchable.includes("birthday") ? "Birthdays" : "",
    searchable.includes("coffee") || searchable.includes("latte") ? "Coffee lovers" : "",
    searchable.includes("party") || searchable.includes("event") ? "Events" : "",
    searchable.includes("baby") ? "Baby showers" : "",
    searchable.includes("valentine") || searchable.includes("love") || searchable.includes("romantic")
      ? "Anniversaries"
      : "",
    product.delivery_available ? "Local delivery" : "",
    product.pickup_only ? "Pickup gifting" : ""
  ].filter(Boolean);

  const fallback = ["Birthdays", "Office gifting", "Just because"];

  return [...adminOccasions, ...inferred, ...fallback]
    .filter((item, index, allItems) => allItems.indexOf(item) === index)
    .slice(0, 3);
}

export function matchesProductIntent(product: ProductWithRelations, intent: string) {
  const haystack = [
    product.name,
    product.short_description ?? "",
    product.description ?? "",
    product.categories?.name ?? "",
    getProductBadges(product).join(" "),
    getProductPerfectFor(product).join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(intent.toLowerCase());
}
