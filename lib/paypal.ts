export function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function hasPayPalLiveEnv() {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
}

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with PayPal.");
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("PayPal did not return an access token.");
  }

  return payload.access_token;
}

export async function createPayPalOrder(input: {
  total: number;
  orderNumber: string;
  localOrderId: string;
  accessToken: string;
}) {
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.orderNumber
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          invoice_id: input.orderNumber,
          custom_id: input.localOrderId,
          amount: {
            currency_code: "USD",
            value: input.total.toFixed(2)
          },
          description: `L&A Amor & Sugar order ${input.orderNumber}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Unable to create the PayPal order.");
  }

  return response.json();
}

export async function capturePayPalOrder(input: {
  paypalOrderId: string;
  orderNumber: string;
  accessToken: string;
}) {
  const response = await fetch(
    `${getPayPalBaseUrl()}/v2/checkout/orders/${input.paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${input.orderNumber}-capture`
      }
    }
  );

  if (!response.ok) {
    throw new Error("Unable to capture the PayPal payment.");
  }

  return response.json();
}
