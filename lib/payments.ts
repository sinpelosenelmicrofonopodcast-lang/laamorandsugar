import type {
  PaymentMethodCode,
  PaymentMethodSettings,
  PaymentSettings,
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
      paypal: { ...DEFAULT_PAYMENT_SETTINGS.paypal },
      cash_app: { ...DEFAULT_PAYMENT_SETTINGS.cash_app },
      zelle: { ...DEFAULT_PAYMENT_SETTINGS.zelle },
      manual_payment_note: DEFAULT_PAYMENT_SETTINGS.manual_payment_note
    };
  }

  const source = value as Record<string, unknown>;

  return {
    stripe: normalizeMethod(source.stripe, DEFAULT_PAYMENT_SETTINGS.stripe),
    paypal: normalizeMethod(source.paypal, DEFAULT_PAYMENT_SETTINGS.paypal),
    cash_app: normalizeMethod(source.cash_app, DEFAULT_PAYMENT_SETTINGS.cash_app),
    zelle: normalizeMethod(source.zelle, DEFAULT_PAYMENT_SETTINGS.zelle),
    manual_payment_note:
      typeof source.manual_payment_note === "string" && source.manual_payment_note.trim()
        ? source.manual_payment_note.trim()
        : DEFAULT_PAYMENT_SETTINGS.manual_payment_note
  };
}

export function normalizeSiteSettings(row: SiteSettingsRow): SiteSettingsModel {
  return {
    ...row,
    payment_settings: normalizePaymentSettings((row as SiteSettingsRow & { payment_settings?: unknown }).payment_settings)
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

  if (hasPayPalLive) {
    methods.push({
      code: "paypal_live",
      settings: {
        enabled: true,
        label: "PayPal",
        account: null,
        payment_url: null,
        instructions: "Pay securely with your PayPal account."
      },
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
