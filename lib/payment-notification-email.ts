import {
  CHECKOUT_PLAN_CONFIG,
  formatCheckoutPlanLabel,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import { formatMoney } from "@/lib/format";
import type { PaymentSubmission } from "@/types/database";

const DEFAULT_NOTIFICATION_TO = "hello@kefoo.tech";

type PaymentNotificationContext = {
  submission: PaymentSubmission;
  customerEmail: string | null;
  customerName: string | null;
  orgName: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPaymentNotificationEmail(context: PaymentNotificationContext) {
  const { submission } = context;
  const plan = submission.plan as CheckoutPlan;
  const planLabel = formatCheckoutPlanLabel(plan);
  const amountLabel =
    CHECKOUT_PLAN_CONFIG[plan]?.priceLabel ??
    formatMoney(submission.amount_idr);
  const customerName = context.customerName?.trim() || "Unknown";
  const customerEmail = context.customerEmail?.trim() || "Unknown";
  const orgName = context.orgName?.trim() || "Unknown workspace";
  const senderName = submission.sender_name?.trim() || "—";
  const proofUrl = submission.proof_url.trim();

  const subject = `New ${planLabel} payment — ${customerName}`;

  const text = [
    "New Kefoo payment submission",
    "",
    `Plan: ${planLabel}`,
    `Amount: ${amountLabel}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Workspace: ${orgName}`,
    `Payment date: ${submission.payment_date}`,
    `Name of Bank Account: ${senderName}`,
    `Submission ID: ${submission.id}`,
    `Org ID: ${submission.org_id}`,
    `Proof: ${proofUrl}`,
  ].join("\n");

  const html = `
    <h2>New Kefoo payment submission</h2>
    <p><strong>Plan:</strong> ${escapeHtml(planLabel)}</p>
    <p><strong>Amount:</strong> ${escapeHtml(amountLabel)}</p>
    <p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
    <p><strong>Workspace:</strong> ${escapeHtml(orgName)}</p>
    <p><strong>Payment date:</strong> ${escapeHtml(submission.payment_date)}</p>
    <p><strong>Name of Bank Account:</strong> ${escapeHtml(senderName)}</p>
    <p><strong>Submission ID:</strong> ${escapeHtml(submission.id)}</p>
    <p><strong>Org ID:</strong> ${escapeHtml(submission.org_id)}</p>
    <p><strong>Proof:</strong> <a href="${escapeHtml(proofUrl)}">View payment proof</a></p>
  `.trim();

  return { subject, text, html };
}

export async function sendPaymentSubmissionNotification(
  context: PaymentNotificationContext,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY is not set; skipping payment notification email.",
    );
    return;
  }

  const to =
    process.env.PAYMENT_NOTIFICATION_TO?.trim() || DEFAULT_NOTIFICATION_TO;
  const from =
    process.env.PAYMENT_NOTIFICATION_FROM?.trim() ||
    "Kefoo Payments <payments@kefoo.tech>";

  const { subject, text, html } = buildPaymentNotificationEmail(context);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send payment notification email:", body);
  }
}
