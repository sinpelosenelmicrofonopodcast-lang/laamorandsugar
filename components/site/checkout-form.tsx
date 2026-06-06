"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createCheckoutSessionAction } from "@/actions/store";
import { calculateDepositBreakdown } from "@/lib/order-payments";
import type {
  FulfillmentOption,
  PaymentMethodCode,
  PaymentMethodSettings,
  ProfileRow,
  SiteSettingsModel
} from "@/lib/types/app";
import { useCartStore } from "@/lib/store/cart-store";
import { checkoutSchema, type CheckoutValues } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import { PayPalCheckoutButton } from "@/components/site/paypal-checkout-button";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { NewsletterSignup } from "@/components/site/newsletter-signup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AvailablePaymentMethod = {
  code: PaymentMethodCode;
  settings: PaymentMethodSettings;
  kind: "stripe" | "manual" | "paypal_live";
};

const checkoutFieldLabels: Partial<Record<keyof CheckoutValues, string>> = {
  customer_name: "name",
  customer_email: "email",
  customer_phone: "phone",
  fulfillment_method: "fulfillment",
  fulfillment_option_id: "pickup or delivery option",
  payment_method: "payment method",
  fulfillment_date: "date",
  fulfillment_time_slot: "preferred time",
  delivery_address_line_1: "address line 1",
  delivery_city: "city",
  delivery_state: "state",
  delivery_zip: "ZIP code",
  items: "cart",
  policies_acknowledged: "allergen and policy acknowledgement"
};

function getCheckoutValidationMessage(values: CheckoutValues) {
  const result = checkoutSchema.safeParse(values);

  if (result.success) {
    return null;
  }

  const issue = result.error.issues[0];
  const field = issue?.path[0] as keyof CheckoutValues | undefined;
  const label = field ? checkoutFieldLabels[field] : null;

  return label ? `Please check ${label}: ${issue.message}` : issue.message;
}

function getFulfillmentOptionFee(
  option: FulfillmentOption | undefined,
  subtotal: number,
  freeDeliveryThreshold?: number | null
) {
  if (!option) {
    return 0;
  }

  if (
    option.type === "delivery" &&
    freeDeliveryThreshold &&
    subtotal >= freeDeliveryThreshold
  ) {
    return 0;
  }

  return Math.max(0, option.fee);
}

function formatCustomOptionSummary(label: string, value: string) {
  if (!value) {
    return null;
  }

  const labels: Record<string, string> = {
    cakeFlavor: "Cake flavor",
    chocolateColor: "Chocolate color"
  };

  return `${labels[label] ?? label}: ${value}`;
}

export function CheckoutForm({
  settings,
  paymentMethods,
  customerProfile,
  customerEmail
}: {
  settings: SiteSettingsModel;
  paymentMethods: AvailablePaymentMethod[];
  customerProfile: ProfileRow | null;
  customerEmail: string;
}) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isPending, startTransition] = useTransition();
  const [appliedNewsletterDiscount, setAppliedNewsletterDiscount] = useState<{
    code: string;
    amount: number;
    percent: number;
  } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const defaultFulfillmentOption = settings.delivery_zones.find(
    (option) => option.type === "pickup"
  ) ?? settings.delivery_zones[0];
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: customerProfile?.full_name ?? "",
      customer_email: customerEmail,
      customer_phone: customerProfile?.phone ?? "",
      fulfillment_method: defaultFulfillmentOption?.type ?? "pickup",
      fulfillment_option_id: defaultFulfillmentOption?.id ?? "",
      payment_method: paymentMethods[0]?.code ?? "stripe",
      fulfillment_date: "",
      fulfillment_time_slot: "",
      notes: "",
      coupon_code: "",
      delivery_address_line_1: "",
      delivery_address_line_2: "",
      delivery_city: "",
      delivery_state: "",
      delivery_zip: "",
      policies_acknowledged: false,
      items
    }
  });

  const fulfillmentMethod = form.watch("fulfillment_method");
  const fulfillmentOptionId = form.watch("fulfillment_option_id");
  const fulfillmentOptions = useMemo(
    () => settings.delivery_zones.filter((option) => option.type === fulfillmentMethod),
    [fulfillmentMethod, settings.delivery_zones]
  );
  const selectedFulfillmentOption =
    fulfillmentOptions.find((option) => option.id === fulfillmentOptionId) ??
    fulfillmentOptions[0];
  const fulfillmentFee = getFulfillmentOptionFee(
    selectedFulfillmentOption,
    subtotal,
    settings.free_delivery_threshold
  );
  const estimatedDiscount = appliedNewsletterDiscount?.amount ?? 0;
  const estimatedTotal = Math.max(0, subtotal - estimatedDiscount + fulfillmentFee);
  const depositBreakdown = useMemo(
    () => calculateDepositBreakdown(estimatedTotal),
    [estimatedTotal]
  );
  const selectedPaymentMethodCode = form.watch("payment_method");
  const couponCode = form.watch("coupon_code") ?? "";
  const formEmail = form.watch("customer_email");
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.code === selectedPaymentMethodCode) ?? paymentMethods[0];
  const isPayPalLiveSelected = selectedPaymentMethod?.kind === "paypal_live";

  useEffect(() => {
    form.setValue("items", items, {
      shouldDirty: false,
      shouldValidate: false
    });
  }, [form, items]);

  useEffect(() => {
    if (!appliedNewsletterDiscount) {
      return;
    }

    if (couponCode.trim().toUpperCase() !== appliedNewsletterDiscount.code) {
      setAppliedNewsletterDiscount(null);
    }
  }, [appliedNewsletterDiscount, couponCode]);

  useEffect(() => {
    if (!selectedFulfillmentOption) {
      form.setValue("fulfillment_option_id", "", {
        shouldDirty: true,
        shouldValidate: true
      });
      return;
    }

    if (selectedFulfillmentOption.id !== fulfillmentOptionId) {
      form.setValue("fulfillment_option_id", selectedFulfillmentOption.id, {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  }, [form, fulfillmentOptionId, selectedFulfillmentOption]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        ...values,
        turnstileToken,
        items
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      clearCart();

      if (result.url) {
        window.location.href = result.url;
      }
    });
  });

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-5 p-8 text-center">
          <h2 className="font-serif text-4xl">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Add products to the cart before opening checkout.
          </p>
          <Button asChild variant="gold">
            <Link href="/shop">Shop now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-5 p-8 text-center">
          <h2 className="font-serif text-4xl">Payment methods are not ready yet</h2>
          <p className="text-muted-foreground">
            Online checkout is temporarily unavailable. Please contact us and we will help complete your order.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Checkout
          </p>
          <CardTitle>Pickup or delivery details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-[1.5rem] border border-bakery-gold/20 bg-bakery-gold/10 p-4 text-sm text-bakery-espresso">
            You are ordering with <span className="font-semibold">{customerEmail}</span>. Your order
            status, messages, and payment updates will stay linked to this account.
          </div>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="customer_name">Name</Label>
              <Input id="customer_name" {...form.register("customer_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input id="customer_phone" {...form.register("customer_phone")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                readOnly
                className="bg-secondary/40"
                {...form.register("customer_email")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_method">Fulfillment</Label>
              <select
                id="fulfillment_method"
                className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
                {...form.register("fulfillment_method", {
                  onChange: (event) => {
                    const nextType = event.target.value as "pickup" | "delivery";
                    const nextOption = settings.delivery_zones.find(
                      (option) => option.type === nextType
                    );

                    form.setValue("fulfillment_option_id", nextOption?.id ?? "", {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }
                })}
              >
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_option_id">
                {fulfillmentMethod === "delivery" ? "Delivery area" : "Pickup area"}
              </Label>
              <select
                id="fulfillment_option_id"
                className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
                {...form.register("fulfillment_option_id")}
              >
                {fulfillmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                    {option.fee > 0 ? ` (+${formatCurrency(option.fee)})` : " (Free)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_date">Date</Label>
              <Input id="fulfillment_date" type="date" {...form.register("fulfillment_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillment_time_slot">Preferred time</Label>
              <Input
                id="fulfillment_time_slot"
                placeholder="Ex. 2:00 PM - 4:00 PM"
                {...form.register("fulfillment_time_slot")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon_code">Coupon</Label>
              <div className="flex gap-2">
                <Input id="coupon_code" placeholder="SWEET10-XXXXXX" {...form.register("coupon_code")} />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isApplyingDiscount || !couponCode}
                  onClick={async () => {
                    setIsApplyingDiscount(true);
                    try {
                      const response = await fetch("/api/discounts/validate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: formEmail,
                          discount_code: couponCode,
                          cart_subtotal: subtotal
                        })
                      });
                      const data = (await response.json()) as {
                        error?: string;
                        discount_percent?: number;
                        discount_amount?: number;
                      };

                      if (!response.ok) {
                        setAppliedNewsletterDiscount(null);
                        toast.error(data.error ?? "Unable to apply discount.");
                        return;
                      }

                      setAppliedNewsletterDiscount({
                        code: couponCode.trim().toUpperCase(),
                        amount: Number(data.discount_amount ?? 0),
                        percent: Number(data.discount_percent ?? 10)
                      });
                      toast.success("Sweet List discount applied.");
                    } finally {
                      setIsApplyingDiscount(false);
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                One discount per order. Sweet List codes are tied to the subscribed email.
              </p>
            </div>
            <div className="space-y-3 md:col-span-2">
              <Label>Payment method</Label>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.code}
                    className={`cursor-pointer rounded-[1.5rem] border p-4 transition ${
                      selectedPaymentMethodCode === method.code
                        ? "border-bakery-gold bg-bakery-gold/10"
                        : "border-border bg-white/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            value={method.code}
                            checked={selectedPaymentMethodCode === method.code}
                            onChange={() =>
                              form.setValue("payment_method", method.code, {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                            }
                          />
                          <span className="font-medium text-foreground">{method.settings.label}</span>
                        </div>
                        {method.settings.instructions ? (
                          <p className="text-sm text-muted-foreground">
                            {method.settings.instructions}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={method.kind === "stripe" ? "gold" : "rose"}>
                        {method.kind === "stripe"
                          ? "Online"
                          : method.kind === "paypal_live"
                            ? "PayPal"
                            : "Manual"}
                      </Badge>
                    </div>
                  </label>
                ))}
              </div>
              {selectedPaymentMethod?.kind === "manual" ? (
                <div className="rounded-[1.5rem] border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    A 50% deposit is required to place this order.
                  </p>
                  <p className="mt-1">
                    Estimated deposit due now: {formatCurrency(depositBreakdown.amountDueNow)}. Remaining balance:
                    {" "}
                    {formatCurrency(depositBreakdown.remainingBalance)}.
                  </p>
                  {selectedPaymentMethod.settings.account ? (
                    <p>
                      <span className="font-medium text-foreground">Send payment to:</span>{" "}
                      {selectedPaymentMethod.settings.account}
                    </p>
                  ) : null}
                  {selectedPaymentMethod.settings.payment_url ? (
                    <p className="mt-2">
                      <span className="font-medium text-foreground">Payment link:</span>{" "}
                      <a
                        href={selectedPaymentMethod.settings.payment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-bakery-rose underline underline-offset-4"
                      >
                        Open payment link
                      </a>
                    </p>
                  ) : null}
                  {settings.payment_settings.manual_payment_note ? (
                    <p className="mt-2">{settings.payment_settings.manual_payment_note}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {fulfillmentMethod === "delivery" ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_address_line_1">Address line 1</Label>
                  <Input
                    id="delivery_address_line_1"
                    {...form.register("delivery_address_line_1")}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_address_line_2">Address line 2</Label>
                  <Input
                    id="delivery_address_line_2"
                    {...form.register("delivery_address_line_2")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_city">City</Label>
                  <Input id="delivery_city" {...form.register("delivery_city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_state">State</Label>
                  <Input id="delivery_state" {...form.register("delivery_state")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_zip">ZIP</Label>
                  <Input id="delivery_zip" {...form.register("delivery_zip")} />
                </div>
              </>
            ) : null}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Order Notes</Label>
              <Textarea id="notes" {...form.register("notes")} />
            </div>
            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-bakery-gold/25 bg-bakery-gold/10 p-4 text-sm text-bakery-espresso transition hover:border-bakery-gold/45 hover:bg-bakery-gold/15">
                <Checkbox
                  id="policies_acknowledged"
                  checked={form.watch("policies_acknowledged")}
                  onCheckedChange={(checked) =>
                    form.setValue("policies_acknowledged", checked === true, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    })
                  }
                  aria-describedby="policies_acknowledged_description policies_acknowledged_error"
                />
                <span className="space-y-1 leading-relaxed">
                  <span className="block font-medium text-foreground">
                    I understand the allergen statement and L&A Amor & Sugar ordering policies.
                  </span>
                  <span id="policies_acknowledged_description" className="block text-muted-foreground">
                    Treats may contain or come into contact with milk, eggs, wheat, soy, peanuts,
                    tree nuts, and other allergens. I have reviewed the policies on timing,
                    pickup or local delivery, deposits, cancellations, and custom order details.
                    <Link href="/policies" className="ml-1 text-bakery-rose underline underline-offset-4">
                      View policies
                    </Link>
                    .
                  </span>
                </span>
              </label>
              {form.formState.errors.policies_acknowledged ? (
                <p id="policies_acknowledged_error" className="mt-2 text-sm text-destructive">
                  {form.formState.errors.policies_acknowledged.message}
                </p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <TurnstileWidget action="checkout" onVerify={setTurnstileToken} />
            </div>
            <div className="md:col-span-2">
              {isPayPalLiveSelected ? (
                <PayPalCheckoutButton
                  active
                  amount={depositBreakdown.amountDueNow}
                  shippingFee={0}
                  preparePayload={async () => {
                    const values = {
                      ...form.getValues(),
                      turnstileToken,
                      items
                    };
                    const validationMessage = getCheckoutValidationMessage(values);

                    if (validationMessage) {
                      await form.trigger();
                      toast.error(validationMessage);
                      return null;
                    }

                    return values;
                  }}
                  onSuccess={clearCart}
                />
              ) : (
                <Button type="submit" variant="gold" size="lg" disabled={isPending}>
                  {selectedPaymentMethod?.kind === "stripe"
                    ? `Pay ${formatCurrency(depositBreakdown.amountDueNow)} deposit`
                    : "Place order and view deposit instructions"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => {
            const itemTotal =
              item.unitPrice * item.quantity;

            return (
              <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty {item.quantity}
                    {item.variantName ? ` • ${item.variantName}` : ""}
                    {item.variantQuantity ? ` • ${item.variantQuantity} pcs` : ""}
                    {Object.keys(item.customOptions ?? {}).length > 0
                      ? ` • ${Object.entries(item.customOptions ?? {})
                          .map(([key, value]) => formatCustomOptionSummary(key, value))
                          .filter(Boolean)
                          .join(", ")}`
                      : ""}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(itemTotal)}</p>
              </div>
            );
          })}
          <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-serif text-3xl text-bakery-rose">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{selectedFulfillmentOption?.label ?? "Fulfillment fee"}</span>
              <span>{formatCurrency(fulfillmentFee)}</span>
            </div>
            {estimatedDiscount > 0 ? (
              <div className="mt-3 flex items-center justify-between text-sm text-bakery-rose">
                <span>Sweet List discount ({appliedNewsletterDiscount?.percent ?? 10}%)</span>
                <span>-{formatCurrency(estimatedDiscount)}</span>
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-sm font-medium text-foreground">
              <span>Estimated total</span>
              <span>{formatCurrency(estimatedTotal)}</span>
            </div>
          </div>
          {!appliedNewsletterDiscount ? (
            <NewsletterSignup variant="compact" />
          ) : null}
          <div className="rounded-[1.5rem] border border-bakery-gold/20 bg-bakery-gold/10 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Estimated deposit due today (50%)</span>
              <span className="font-serif text-3xl text-bakery-gold">
                {formatCurrency(depositBreakdown.amountDueNow)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Remaining balance</span>
              <span>{formatCurrency(depositBreakdown.remainingBalance)}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Final deposit is calculated from the confirmed order total after any valid coupon or delivery fee.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white/70 px-4 py-4 text-sm text-muted-foreground">
            Paying with <span className="font-medium text-foreground">{selectedPaymentMethod?.settings.label}</span>
            {selectedPaymentMethod?.kind === "manual"
              ? " will create the order first and show you how to send the 50% deposit on the next screen."
              : selectedPaymentMethod?.kind === "paypal_live"
                ? " will open the secure PayPal popup for the 50% deposit."
                : " will redirect you to secure checkout for the 50% deposit."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
