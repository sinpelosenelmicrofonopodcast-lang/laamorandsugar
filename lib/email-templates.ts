import { absoluteUrl, formatCurrency } from "@/lib/utils";
import { getCustomerOrderStatusLabel } from "@/lib/order-status";

type OrderEmailInput = {
  customerName: string;
  orderNumber: string;
  status: string;
  message: string;
  fulfillmentMethod: string;
  fulfillmentDate: string;
  fulfillmentTimeSlot?: string | null;
  orderAccessToken?: string | null;
};

type SimpleEmailInput = {
  title: string;
  eyebrow?: string;
  greeting?: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPremiumEmail(input: SimpleEmailInput) {
  const eyebrow = input.eyebrow ?? "L&A Amor & Sugar";
  const textLines = [
    input.greeting,
    input.body,
    input.buttonUrl ? `${input.buttonLabel ?? "View details"}: ${input.buttonUrl}` : null,
    input.footerNote,
    "L&A Amor & Sugar"
  ].filter(Boolean);

  return {
    text: textLines.join("\n\n"),
    html: `
      <div style="margin:0;padding:0;background:#fff7fa;color:#3b2e2a;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
          <div style="border-radius:30px;overflow:hidden;border:1px solid #f3d6dd;background:linear-gradient(135deg,#ffffff 0%,#fff7fa 62%,#fbf0e2 100%);box-shadow:0 24px 70px rgba(95,74,65,0.12);">
            <div style="padding:30px 30px 10px;text-align:center;">
              <img src="${absoluteUrl("/brand/la-logo-official.png")}" alt="L&A Amor & Sugar" style="max-width:220px;width:70%;height:auto;" />
            </div>
            <div style="padding:24px 30px 34px;">
              <p style="margin:0 0 14px;color:#c59b45;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;font-weight:800;">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0;color:#3b2e2a;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.08;font-weight:600;">${escapeHtml(input.title)}</h1>
              ${input.greeting ? `<p style="margin:22px 0 0;font-size:16px;line-height:1.8;">${escapeHtml(input.greeting)}</p>` : ""}
              <p style="margin:16px 0 0;font-size:16px;line-height:1.8;color:#66504a;">${escapeHtml(input.body)}</p>
              ${input.buttonUrl ? `<a href="${input.buttonUrl}" style="display:inline-block;margin-top:26px;background:#c59b45;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800;">${escapeHtml(input.buttonLabel ?? "View details")}</a>` : ""}
              ${input.footerNote ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#80655c;">${escapeHtml(input.footerNote)}</p>` : ""}
            </div>
          </div>
          <p style="margin:18px 0 0;text-align:center;color:#8a6d63;font-size:12px;">Luxury dessert gifts, custom treats, and sweet moments in Killeen, TX.</p>
        </div>
      </div>
    `
  };
}

export function buildOrderStatusEmailContent(input: OrderEmailInput) {
  const statusLabel = getCustomerOrderStatusLabel(input.status);
  const url = input.orderAccessToken
    ? absoluteUrl(`/order-status/${input.orderAccessToken}`)
    : absoluteUrl("/order-status");
  const fulfillmentLabel =
    input.fulfillmentMethod === "delivery" ? "Delivery details" : "Pickup details";
  const fulfillmentText = [input.fulfillmentDate, input.fulfillmentTimeSlot]
    .filter(Boolean)
    .join(" • ");

  const details = `Order number: ${input.orderNumber}
Current status: ${statusLabel}
${fulfillmentLabel}: ${fulfillmentText || "We will confirm the timing soon."}`;

  const email = renderPremiumEmail({
    eyebrow: "Order update",
    title: statusLabel,
    greeting: `Hi ${input.customerName},`,
    body: `${input.message}\n\n${details}`,
    buttonLabel: "View order status",
    buttonUrl: url,
    footerNote: "We’ll keep this page updated as your order moves through preparation, pickup, or delivery."
  });

  return {
    ...email,
    text: `Hi ${input.customerName},\n\n${input.message}\n\n${details}\n\nView your order: ${url}\n\nL&A Amor & Sugar`
  };
}

export const premiumEmailTemplates = {
  orderConfirmation: (input: { customerName: string; orderNumber: string; orderUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Order received",
      title: "Your sweet order has officially been received",
      greeting: `Hi ${input.customerName},`,
      body: `We received order ${input.orderNumber}. We’ll review the details and keep you posted as your luxury dessert gift moves forward.`,
      buttonLabel: "View order",
      buttonUrl: input.orderUrl
    }),
  paymentConfirmation: (input: { customerName: string; orderNumber: string; orderUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Payment confirmed",
      title: "Your payment is confirmed",
      greeting: `Hi ${input.customerName},`,
      body: `Payment for order ${input.orderNumber} has been received. Your sweet gift is now in our preparation queue.`,
      buttonLabel: "View order",
      buttonUrl: input.orderUrl
    }),
  inPreparation: (input: { customerName: string; orderUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "In preparation",
      title: "We’re making your treats fresh right now",
      greeting: `Hi ${input.customerName},`,
      body: "Your order is being prepared with the colors, details, and gift-ready finish you requested.",
      buttonLabel: "View updates",
      buttonUrl: input.orderUrl
    }),
  readyForPickup: (input: { customerName: string; orderUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Ready for pickup",
      title: "Your sweet order is ready",
      greeting: `Hi ${input.customerName},`,
      body: "Your order is ready for pickup. Please check your order page for pickup notes and timing details.",
      buttonLabel: "View pickup details",
      buttonUrl: input.orderUrl
    }),
  deliveryUpdate: (input: { customerName: string; orderUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Delivery update",
      title: "Your order is on the way",
      greeting: `Hi ${input.customerName},`,
      body: "Your luxury dessert gift is out for delivery. Keep an eye on your order page for updates.",
      buttonLabel: "Track order",
      buttonUrl: input.orderUrl
    }),
  thankYou: (input: { customerName: string }) =>
    renderPremiumEmail({
      eyebrow: "Thank you",
      title: "Thank you for choosing L&A Amor & Sugar",
      greeting: `Hi ${input.customerName},`,
      body: "We hope your sweet gift made the moment feel special. Thank you for trusting us with your celebration."
    }),
  reviewRequest: (input: { customerName: string; reviewUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Real sweet moments",
      title: "How did we do?",
      greeting: `Hi ${input.customerName},`,
      body: "Your review helps other customers choose unforgettable dessert gifts for their own moments.",
      buttonLabel: "Leave a review",
      buttonUrl: input.reviewUrl
    }),
  abandonedCart: (input: { cartUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "You left something sweet behind",
      title: "Your sweet gift is still waiting",
      body: "Come back to finish your order before limited handcrafted availability fills up.",
      buttonLabel: "Return to cart",
      buttonUrl: input.cartUrl
    }),
  newsletterWelcome: (input: { discountCode: string; shopUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Sweet List",
      title: "Welcome to the Sweet List",
      body: `Your one-time welcome code is ${input.discountCode}. Use it on your first order for 10% off.`,
      buttonLabel: "Shop sweet gifts",
      buttonUrl: input.shopUrl
    }),
  promoCampaign: (input: { title: string; body: string; url: string }) =>
    renderPremiumEmail({
      eyebrow: "Sweet drop",
      title: input.title,
      body: input.body,
      buttonLabel: "View special",
      buttonUrl: input.url
    }),
  customOrderConfirmation: (input: { customerName: string }) =>
    renderPremiumEmail({
      eyebrow: "Custom order request",
      title: "We received your custom sweet idea",
      greeting: `Hi ${input.customerName},`,
      body: "We’ll review your theme, colors, details, and pickup or delivery preferences, then follow up with next steps."
    }),
  adminOrderAlert: (input: { orderNumber: string; customerName: string; total: number; adminUrl: string }) =>
    renderPremiumEmail({
      eyebrow: "Admin alert",
      title: "New order received",
      body: `Order ${input.orderNumber} from ${input.customerName} is ready for review. Order total: ${formatCurrency(input.total)}.`,
      buttonLabel: "Open order",
      buttonUrl: input.adminUrl
    })
};
