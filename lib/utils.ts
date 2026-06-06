import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatCompactCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function absoluteUrl(path = "") {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://amorandsugarla.com";

  return `${baseUrl}${path}`;
}

export function parseCurrencyInput(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveImageUrl(
  image:
    | {
        image_url?: string | null;
        url?: string | null;
      }
    | null
    | undefined
) {
  const value = image?.image_url ?? image?.url ?? null;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function resolveVariantQuantity(
  variant:
    | {
        quantity?: number | null;
        option_value?: string | null;
      }
    | null
    | undefined
) {
  if (typeof variant?.quantity === "number" && Number.isFinite(variant.quantity)) {
    return variant.quantity;
  }

  const optionValue = typeof variant?.option_value === "string" ? variant.option_value : "";
  const digits = optionValue.replace(/\D/g, "");
  const parsed = Number(digits);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function resolveVariantPrice(
  variant:
    | {
        price?: number | null;
        price_delta?: number | null;
      }
    | null
    | undefined,
  basePrice = 0
) {
  if (typeof variant?.price === "number" && Number.isFinite(variant.price)) {
    return variant.price;
  }

  const delta =
    typeof variant?.price_delta === "number" && Number.isFinite(variant.price_delta)
      ? variant.price_delta
      : 0;

  return basePrice + delta;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    const messages = Array.from(
      new Set(
        error.issues.map((issue) => {
          const [root, nested] = issue.path;
          const label =
            root === "business_hours" && typeof nested === "string"
              ? `${nested.charAt(0).toUpperCase()}${nested.slice(1)} hours`
              : root === "delivery_zones" && typeof nested === "number"
                ? `Delivery zone ${nested + 1}`
                : typeof root === "string"
                  ? root
                      .split("_")
                      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                      .join(" ")
                  : "This field";

          if (!issue.message || issue.message.startsWith("Expected")) {
            return `${label} has an invalid value.`;
          }

          if (issue.message.startsWith(label)) {
            return issue.message;
          }

          return `${label}: ${issue.message}`;
        })
      )
    );

    return messages.join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
    };

    const parts = [
      typeof record.message === "string" ? record.message : null,
      typeof record.details === "string" ? record.details : null,
      typeof record.hint === "string" ? record.hint : null,
      typeof record.error_description === "string" ? record.error_description : null
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" ");
    }

    if (typeof record.code === "string") {
      return `Request failed with code ${record.code}.`;
    }
  }

  return "Something went wrong. Please try again.";
}
