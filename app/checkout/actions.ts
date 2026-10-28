"use server";

import { redirect } from "next/navigation";
import { PAYMENT_CONFIG } from "@/lib/wedding/payment-config";
import {
  loadAccountContext,
  loadWeddingSession,
} from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { text } from "@/lib/wedding/validation";

const BUCKET = "payment-receipts";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export async function submitPaymentAction(formData: FormData): Promise<void> {
  const account = await loadAccountContext();
  if (!account) redirect("/wedding/login?next=/checkout");

  const senderName = text(formData, "senderName").slice(0, 120);
  if (senderName.length < 1) {
    redirect("/checkout?error=sender");
  }

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/checkout?error=receipt");
  }
  if (file.size > MAX_BYTES) redirect("/checkout?error=size");
  if (!ALLOWED.includes(file.type)) redirect("/checkout?error=type");

  const supabase = await createWeddingClient();
  const userId = account.userId;
  // Payment may happen BEFORE onboarding, so the wedding is optional.
  const weddingId = ((await loadWeddingSession())?.wedding.id) ?? null;

  const extension =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) redirect("/checkout?error=upload");

  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      wedding_id: weddingId ?? undefined,
      amount_idr: PAYMENT_CONFIG.amountIdr,
      currency: "IDR",
      method: "bank_transfer",
      status: "pending_review",
      sender_name: senderName,
      receipt_path: path,
    })
    .select("id, reference")
    .single();

  if (insertError || !payment) {
    await supabase.storage.from(BUCKET).remove([path]);
    if (insertError?.code === "23505") redirect("/checkout?error=duplicate");
    redirect("/checkout?error=save");
  }

  await notifyAdmin({
    reference: payment.reference,
    senderName,
    email: account.email ?? "-",
    amount: PAYMENT_CONFIG.amountIdr,
    submittedAt: new Date().toISOString(),
  }).then(async (ok) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return;
    const admin = createServiceClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin
      .from("payments")
      .update({
        email_status: ok ? "sent" : "failed",
        email_attempts: 1,
        email_last_error: ok ? null : "Resend request failed",
      })
      .eq("id", payment.id);
  });

  redirect("/checkout?sent=1");
}

async function notifyAdmin(input: {
  reference: string;
  senderName: string;
  email: string;
  amount: number;
  submittedAt: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.PAYMENT_NOTIFICATION_TO ?? PAYMENT_CONFIG.notificationEmail;
  const from = process.env.PAYMENT_NOTIFICATION_FROM;

  if (!apiKey || !from) return false;

  const html = `
    <h2>Pengajuan pembayaran baru — ${escapeHtml(input.reference)}</h2>
    <p><strong>Nama pemilik rekening pengirim:</strong> ${escapeHtml(input.senderName)}</p>
    <p><strong>Email customer:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Referensi:</strong> ${escapeHtml(input.reference)}</p>
    <p><strong>Nominal:</strong> Rp${input.amount.toLocaleString("id-ID")}</p>
    <p><strong>Waktu:</strong> ${escapeHtml(input.submittedAt)}</p>
    <p><strong>Status:</strong> pending_review</p>
    <p>Buka dashboard admin untuk memverifikasi bukti transfer.</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New Wedding Planner Payment Submission — ${input.reference}`,
        html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
