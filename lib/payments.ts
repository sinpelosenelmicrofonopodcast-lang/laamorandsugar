import type {
  FulfillmentOption,
  PaymentMethodCode,
  PaymentMethodSettings,
  PaymentSettings,
  FeatureSettings,
  SiteSettingsModel,
  SiteSettingsRow
} from "@/lib/types/app";

const baseMethod = (label: string): PaymentMethodSettings => ({
  enabled: false,
  label,
  account: null,
  payment_url: null,
  instructions: null
});

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  stripe: {
    ...baseMethod("Credit or debit card"),
    enabled: true,
    instructions: "Pay securely online with card."
  },
  paypal_live: {
    ...baseMethod("PayPal"),
    instructions: "Pay securely with your PayPal account."
  },
  paypal: {
    ...baseMethod("PayPal"),
    instructions: "Send payment through PayPal using the details below."
  },
  cash_app: {
    ...baseMethod("Cash App"),
    instructions: "Send payment through Cash App using the cashtag or payment link below."
  },
  zelle: {
    ...baseMethod("Zelle"),
    instructions: "Send payment through Zelle using the recipient details below."
  },
  manual_payment_note:
    "Orders stay pending until payment is received and confirmed."
};

export const DEFAULT_FULFILLMENT_OPTIONS: FulfillmentOption[] = [
  {
    id: "pickup-heb-copperas-cove",
    type: "pickup",
    label: "Free Pick Up HEB Copperas Cove",
    fee: 0
  },
  {
    id: "delivery-belton",
    type: "delivery",
    label: "Belton delivery",
    fee: 10
  }
];

export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  treat_designer_enabled: true,
  treat_designer_disabled_message:
    "Treat Designer is temporarily paused while we polish the experience. Please request a custom order and we will help you personally."
};

function slugifyOption(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMethod(
  value: unknown,
  fallback: PaymentMethodSettings
): PaymentMethodSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...fallback };
  }

  const source = value as Record<string, unknown>;

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : fallback.enabled,
    label: typeof source.label === "string" && source.label.trim() ? source.label : fallback.label,
    account:
      typeof source.account === "string" && source.account.trim() ? source.account.trim() : null,
    payment_url:
      typeof source.payment_url === "string" && source.payment_url.trim()
        ? source.payment_url.trim()
        : null,
    instructions:
      typeof source.instructions === "string" && source.instructions.trim()
        ? source.instructions.trim()
        : fallback.instructions
  };
}

export function normalizePaymentSettings(value: unknown): PaymentSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      stripe: { ...DEFAULT_PAYMENT_SETTINGS.stripe },
      paypal_live: { ...DEFAULT_PAYMENT_SETTINGS.paypal_live },
      paypal: { ...DEFAULT_PAYMENT_SETTINGS.paypal },
      cash_app: { ...DEFAULT_PAYMENT_SETTINGS.cash_app },
      zelle: { ...DEFAULT_PAYMENT_SETTINGS.zelle },
      manual_payment_note: DEFAULT_PAYMENT_SETTINGS.manual_payment_note
    };
  }

  const source = value as Record<string, unknown>;

  return {
    stripe: normalizeMethod(source.stripe, DEFAULT_PAYMENT_SETTINGS.stripe),
    paypal_live: normalizeMethod(source.paypal_live, DEFAULT_PAYMENT_SETTINGS.paypal_live),
    paypal: normalizeMethod(source.paypal, DEFAULT_PAYMENT_SETTINGS.paypal),
    cash_app: normalizeMethod(source.cash_app, DEFAULT_PAYMENT_SETTINGS.cash_app),
    zelle: normalizeMethod(source.zelle, DEFAULT_PAYMENT_SETTINGS.zelle),
    manual_payment_note:
      typeof source.manual_payment_note === "string" && source.manual_payment_note.trim()
        ? source.manual_payment_note.trim()
        : DEFAULT_PAYMENT_SETTINGS.manual_payment_note
  };
}

export function normalizeFulfillmentOptions(value: unknown): FulfillmentOption[] {
  if (!Array.isArray(value)) {
    return DEFAULT_FULFILLMENT_OPTIONS.map((option) => ({ ...option }));
  }

  const options = value
    .map((entry, index): FulfillmentOption | null => {
      if (typeof entry === "string" && entry.trim()) {
        const label = entry.trim();

        return {
          id: `delivery-${slugifyOption(label) || index}`,
          type: "delivery",
          label,
          fee: 20
        };
      }

      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const source = entry as Record<string, unknown>;
      const type = source.type === "pickup" ? "pickup" : "delivery";
      const label = typeof source.label === "string" ? source.label.trim() : "";
      const fee = Number(source.fee ?? 0);

      if (!label) {
        return null;
      }

      return {
        id:
          typeof source.id === "string" && source.id.trim()
            ? source.id.trim()
            : `${type}-${slugifyOption(label) || index}`,
        type,
        label,
        fee: Number.isFinite(fee) && fee > 0 ? Math.round(fee * 100) / 100 : 0
      };
    })
    .filter((option): option is FulfillmentOption => Boolean(option));

  if (options.length === 0) {
    return DEFAULT_FULFILLMENT_OPTIONS.map((option) => ({ ...option }));
  }

  const hasPickup = options.some((option) => option.type === "pickup");
  const hasDelivery = options.some((option) => option.type === "delivery");
  const defaultsToAdd = DEFAULT_FULFILLMENT_OPTIONS.filter(
    (option) =>
      (option.type === "pickup" && !hasPickup) ||
      (option.type === "delivery" && !hasDelivery)
  );

  return [...defaultsToAdd.map((option) => ({ ...option })), ...options];
}

export function normalizeFeatureSettings(value: unknown): FeatureSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_FEATURE_SETTINGS };
  }

  const source = value as Record<string, unknown>;
  const message =
    typeof source.treat_designer_disabled_message === "string" &&
    source.treat_designer_disabled_message.trim()
      ? source.treat_designer_disabled_message.trim()
      : DEFAULT_FEATURE_SETTINGS.treat_designer_disabled_message;

  return {
    treat_designer_enabled:
      typeof source.treat_designer_enabled === "boolean"
        ? source.treat_designer_enabled
        : DEFAULT_FEATURE_SETTINGS.treat_designer_enabled,
    treat_designer_disabled_message: message
  };
}

export function normalizeSiteSettings(row: SiteSettingsRow): SiteSettingsModel {
  const paymentSettingsSource = (row as SiteSettingsRow & { payment_settings?: unknown }).payment_settings;
  const paymentSettingsObject =
    paymentSettingsSource && typeof paymentSettingsSource === "object" && !Array.isArray(paymentSettingsSource)
      ? paymentSettingsSource as Record<string, unknown>
      : {};

  return {
    ...row,
    delivery_zones: normalizeFulfillmentOptions(row.delivery_zones),
    payment_settings: normalizePaymentSettings(paymentSettingsSource),
    feature_settings: normalizeFeatureSettings(
      (row as SiteSettingsRow & { feature_settings?: unknown }).feature_settings ??
        paymentSettingsObject._feature_settings
    )
  };
}

export function getAvailablePaymentMethods(
  settings: SiteSettingsModel,
  hasStripeSecretKey: boolean,
  hasPayPalLive = false
) {
  const methods: {
    code: PaymentMethodCode;
    settings: PaymentMethodSettings;
    kind: "stripe" | "manual" | "paypal_live";
  }[] = [];

  if (settings.payment_settings.stripe.enabled && hasStripeSecretKey) {
    methods.push({
      code: "stripe",
      settings: settings.payment_settings.stripe,
      kind: "stripe"
    });
  }

  if (hasPayPalLive && settings.payment_settings.paypal_live.enabled) {
    methods.push({
      code: "paypal_live",
      settings: settings.payment_settings.paypal_live,
      kind: "paypal_live"
    });
  }

  (["paypal", "cash_app", "zelle"] as const).forEach((code) => {
    if (settings.payment_settings[code].enabled) {
      methods.push({
        code,
        settings: settings.payment_settings[code],
        kind: "manual"
      });
    }
  });

  return methods;
}
