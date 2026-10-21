"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { PAYMENT_CONFIG } from "@/lib/wedding/payment-config";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { getCurrentUser } from "@/lib/wedding/session";
import { text } from "@/lib/wedding/validation";

export type AdminResult = { error?: string; success?: string } | null;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: "Tidak memiliki akses." as const };

  const supabase = await createWeddingClient();
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { error: "Tidak memiliki akses." as const };
  return { supabase, user };
}

export async function approvePaymentAction(formData: FormData): Promise<void> {
  const id = text(formData, "paymentId");
  const ctx = await requireAdmin();
  if ("error" in ctx) return;

  // RPC enforces is_admin(), locks the row, is idempotent, and grants
  // lifetime access only to the wedding stored on the payment.
  await ctx.supabase.rpc("approve_payment", { p_payment_id: id });

  revalidatePath("/admin/payments");
}

export async function rejectPaymentAction(formData: FormData): Promise<void> {
  const id = text(formData, "paymentId");
  const reason = text(formData, "reason").slice(0, 500);
  const ctx = await requireAdmin();
  if ("error" in ctx) return;

  await ctx.supabase.rpc("reject_payment", {
    p_payment_id: id,
    p_reason: reason || null,
  });

  revalidatePath("/admin/payments");
}

/** Re-send the admin notification for a payment whose email failed. */
export async function retryEmailAction(formData: FormData): Promise<void> {
  const id = text(formData, "paymentId");
  const ctx = await requireAdmin();
  if ("error" in ctx) return;

  const { data: payment } = await ctx.supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!payment) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PAYMENT_NOTIFICATION_FROM;
  const to = process.env.PAYMENT_NOTIFICATION_TO ?? PAYMENT_CONFIG.notificationEmail;

  let ok = false;
  if (apiKey && from) {
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
          subject: `New Wedding Planner Payment Submission — ${payment.reference}`,
          html: `<p><strong>${payment.reference}</strong></p>
            <p>Pengirim: ${payment.sender_name}</p>
            <p>Nominal: Rp${Number(payment.amount_idr).toLocaleString("id-ID")}</p>
            <p>Status: ${payment.status}</p>`,
        }),
      });
      ok = response.ok;
    } catch {
      ok = false;
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin
      .from("payments")
      .update({
        email_status: ok ? "sent" : "failed",
        email_attempts: Number(payment.email_attempts ?? 0) + 1,
        email_last_error: ok ? null : "Resend request failed",
      })
      .eq("id", id);
  }

  revalidatePath("/admin/payments");
}
