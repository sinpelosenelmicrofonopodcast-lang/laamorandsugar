import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cron from "node-cron";
import twilio from "twilio";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController
} from "@paypal/paypal-server-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, ".env") });

const PORT = Number(process.env.PORT ?? 3000);
const CURRENCY_CODE = process.env.PAYPAL_CURRENCY_CODE ?? "USD";
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT ?? "live";
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? process.env.PAYPAL_SECRET;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const orders = [];

function hasUsableEnvValue(value, placeholder) {
  return Boolean(value && value.trim() && value !== placeholder && value !== "REPLACE_ME");
}

const paypalIsConfigured =
  hasUsableEnvValue(clientId, "REPLACE_ME") && hasUsableEnvValue(clientSecret, "REPLACE_ME");

const twilioIsConfigured =
  hasUsableEnvValue(twilioAccountSid, "your_sid") &&
  hasUsableEnvValue(twilioAuthToken, "your_token") &&
  hasUsableEnvValue(twilioPhoneNumber, "your_twilio_number");
const twilioClient = twilioIsConfigured ? twilio(twilioAccountSid, twilioAuthToken) : null;

const paypalClient = paypalIsConfigured
  ? new Client({
      environment:
        PAYPAL_ENVIRONMENT === "sandbox" ? Environment.Sandbox : Environment.Production,
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret
      }
    })
  : null;
const ordersController = paypalClient ? new OrdersController(paypalClient) : null;
const app = express();

app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});

function parseMoney(value, fieldName) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error(`${fieldName} must be a valid non-negative number.`);
    error.statusCode = 400;
    throw error;
  }

  return Math.round(amount * 100) / 100;
}

function getOrderAmount(body) {
  const itemAmount = parseMoney(body.amount, "amount");
  const shippingFee = parseMoney(body.shippingFee, "shippingFee");
  const total = Math.round((itemAmount + shippingFee) * 100) / 100;

  if (itemAmount <= 0 || total <= 0) {
    const error = new Error("amount must be greater than 0.");
    error.statusCode = 400;
    throw error;
  }

  return {
    itemAmount,
    shippingFee,
    total
  };
}

function getErrorPayload(error) {
  return {
    error: error instanceof Error ? error.message : "Unexpected PayPal server error."
  };
}

function normalizePhone(phone) {
  return String(phone ?? "").trim();
}

function getPhoneDigits(phone) {
  return normalizePhone(phone).replace(/\D/g, "");
}

function findOrderById(orderId) {
  return orders.find((order) => order.id === orderId);
}

function findLatestOrderByPhone(phone) {
  const incomingDigits = getPhoneDigits(phone);

  return [...orders]
    .reverse()
    .find((order) => {
      const orderDigits = getPhoneDigits(order.phone);

      return orderDigits && incomingDigits.endsWith(orderDigits.slice(-10));
    });
}

function parsePickupDate(pickupDate) {
  const parsed = new Date(pickupDate);

  if (Number.isNaN(parsed.getTime())) {
    const error = new Error("pickupDate must be a valid date or ISO date string.");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function shouldSendReminder(order, now = new Date()) {
  if (order.reminderSent) {
    return false;
  }

  const pickupTime = parsePickupDate(order.pickupDate).getTime();
  const hoursUntilPickup = (pickupTime - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilPickup > 0 && hoursUntilPickup <= 24;
}

function createOrderRecord({ name, phone, pickupDate }) {
  return {
    id: randomUUID(),
    name: String(name).trim(),
    phone: normalizePhone(phone),
    pickupDate,
    status: "received",
    reminderSent: false,
    upsellSent: false
  };
}

function validateOrderCreatedPayload(body) {
  const name = String(body?.name ?? "").trim();
  const phone = normalizePhone(body?.phone);
  const pickupDate = body?.pickupDate;

  if (!name) {
    const error = new Error("name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!phone) {
    const error = new Error("phone is required.");
    error.statusCode = 400;
    throw error;
  }

  parsePickupDate(pickupDate);

  return { name, phone, pickupDate };
}

async function sendSMS(to, message) {
  if (!to || !message) {
    const error = new Error("sendSMS requires both to and message.");
    error.statusCode = 400;
    throw error;
  }

  if (!twilioClient) {
    console.warn("[twilio:mock-sms]", {
      to,
      from: twilioPhoneNumber ?? "not configured",
      message
    });

    return {
      sid: `mock-${Date.now()}`,
      status: "mocked",
      to,
      body: message
    };
  }

  const result = await twilioClient.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to
  });

  console.log("[twilio:sms-sent]", {
    sid: result.sid,
    to,
    status: result.status
  });

  return {
    sid: result.sid,
    status: result.status,
    to: result.to,
    body: message
  };
}

app.get("/orders", (_request, response) => {
  response.json({
    count: orders.length,
    orders
  });
});

app.post("/order-created", async (request, response) => {
  try {
    const values = validateOrderCreatedPayload(request.body);
    const order = createOrderRecord(values);
    orders.push(order);

    const sms = await sendSMS(
      order.phone,
      `Hi ${order.name}! Your order with L&A Amor & Sugar has been received. Pickup: ${order.pickupDate}. Thank you!`
    );

    console.log("[twilio:order-created]", {
      id: order.id,
      phone: order.phone,
      pickupDate: order.pickupDate
    });

    response.status(201).json({
      success: true,
      order,
      sms
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    console.error("[twilio:order-created]", error);
    response.status(statusCode).json(getErrorPayload(error));
  }
});

app.post("/order-preparing/:id", async (request, response) => {
  try {
    const order = findOrderById(request.params.id);

    if (!order) {
      return response.status(404).json({ error: "Order not found." });
    }

    order.status = "preparing";
    const sms = await sendSMS(
      order.phone,
      "We’re working on your treats! L&A Amor & Sugar is preparing your order."
    );

    console.log("[twilio:order-preparing]", { id: order.id });
    response.json({ success: true, order, sms });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    console.error("[twilio:order-preparing]", error);
    response.status(statusCode).json(getErrorPayload(error));
  }
});

app.post("/order-ready/:id", async (request, response) => {
  try {
    const order = findOrderById(request.params.id);

    if (!order) {
      return response.status(404).json({ error: "Order not found." });
    }

    order.status = "ready";
    order.upsellSent = true;
    const sms = await sendSMS(
      order.phone,
      "Your order is READY! You can pick it up today. Reply YES to add cake pops for $10"
    );

    console.log("[twilio:order-ready]", { id: order.id, upsellSent: order.upsellSent });
    response.json({ success: true, order, sms });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    console.error("[twilio:order-ready]", error);
    response.status(statusCode).json(getErrorPayload(error));
  }
});

app.post("/incoming-sms", async (request, response) => {
  try {
    const messageBody = String(request.body?.Body ?? "").trim();
    const from = normalizePhone(request.body?.From);

    if (!from) {
      return response.status(400).json({ error: "Missing Twilio From phone number." });
    }

    const order = findLatestOrderByPhone(from);
    const customerSaidYes = messageBody.toUpperCase() === "YES";
    const reply =
      customerSaidYes && (!order || order.upsellSent)
        ? "Added! Cake pops added to your order. Total will be updated at pickup"
        : "No worries, your order is all set!";

    if (order && customerSaidYes) {
      order.upsellAccepted = true;
    }

    const sms = await sendSMS(from, reply);

    console.log("[twilio:incoming-sms]", {
      from,
      body: messageBody,
      matchedOrderId: order?.id ?? null,
      customerSaidYes
    });

    response.json({
      success: true,
      matchedOrderId: order?.id ?? null,
      reply,
      sms
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    console.error("[twilio:incoming-sms]", error);
    response.status(statusCode).json(getErrorPayload(error));
  }
});

app.post("/create-order", async (request, response) => {
  try {
    if (!ordersController) {
      return response.status(503).json({
        error: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env."
      });
    }

    const { itemAmount, shippingFee, total } = getOrderAmount(request.body ?? {});
    const referenceId = request.body?.referenceId ?? `order-${Date.now()}`;

    const paypalResponse = await ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId,
            customId: request.body?.customId,
            description: request.body?.description ?? "Website checkout",
            amount: {
              currencyCode: CURRENCY_CODE,
              value: total.toFixed(2),
              breakdown: {
                itemTotal: {
                  currencyCode: CURRENCY_CODE,
                  value: itemAmount.toFixed(2)
                },
                shipping: {
                  currencyCode: CURRENCY_CODE,
                  value: shippingFee.toFixed(2)
                }
              }
            }
          }
        ]
      },
      paypalRequestId: referenceId,
      prefer: "return=representation"
    });

    response.status(201).json({
      id: paypalResponse.result.id,
      status: paypalResponse.result.status,
      amount: {
        currencyCode: CURRENCY_CODE,
        value: total.toFixed(2),
        itemAmount: itemAmount.toFixed(2),
        shippingFee: shippingFee.toFixed(2)
      }
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    console.error("[paypal:create-order]", error);
    response.status(statusCode).json(getErrorPayload(error));
  }
});

app.post("/capture-order/:orderID", async (request, response) => {
  try {
    if (!ordersController) {
      return response.status(503).json({
        error: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env."
      });
    }

    const { orderID } = request.params;

    if (!orderID) {
      return response.status(400).json({ error: "Missing PayPal orderID." });
    }

    const paypalResponse = await ordersController.captureOrder({
      id: orderID,
      paypalRequestId: `${orderID}-capture`,
      prefer: "return=representation"
    });
    const capture =
      paypalResponse.result.purchaseUnits?.[0]?.payments?.captures?.[0] ?? null;

    response.json({
      success: paypalResponse.result.status === "COMPLETED",
      id: paypalResponse.result.id,
      status: paypalResponse.result.status,
      payer: paypalResponse.result.payer,
      transaction: capture
        ? {
            id: capture.id,
            status: capture.status,
            amount: capture.amount,
            finalCapture: capture.finalCapture
          }
        : null
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    console.error("[paypal:capture-order]", error);
    response.status(statusCode).json(getErrorPayload(error));
  }
});

cron.schedule("0 * * * *", async () => {
  console.log("[twilio:cron] Checking pickup reminders");

  for (const order of orders) {
    try {
      if (!shouldSendReminder(order)) {
        continue;
      }

      const sms = await sendSMS(
        order.phone,
        "Reminder: You have a pickup tomorrow with L&A Amor & Sugar."
      );
      order.reminderSent = true;

      console.log("[twilio:reminder-sent]", {
        orderId: order.id,
        smsSid: sms.sid
      });
    } catch (error) {
      console.error("[twilio:reminder-error]", {
        orderId: order.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }
});

const server = app.listen(PORT, () => {
  console.log(`L&A Amor & Sugar automation server running on port ${PORT}`);
  console.log(
    paypalIsConfigured
      ? `PayPal checkout server running in ${PAYPAL_ENVIRONMENT} mode`
      : "PayPal checkout endpoints are disabled until PAYPAL_* values are configured."
  );
  console.log(
    twilioIsConfigured
      ? "Twilio SMS is configured and ready."
      : "Twilio SMS is running in mock mode. Add TWILIO_* values to .env to send real SMS."
  );
});

server.on("error", (error) => {
  console.error("[paypal:server]", error);
  process.exit(1);
});
