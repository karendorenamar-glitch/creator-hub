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

export async function approvePaymentAction(
  _prev: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  const id = text(formData, "paymentId");
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: "Tidak memiliki akses admin." };

  // RPC enforces is_admin(), locks the row, is idempotent, and grants lifetime
  // access to the account (and its wedding when one is linked).
  const { error } = await ctx.supabase.rpc("approve_payment", {
    p_payment_id: id,
  });

  if (error) {
    console.error("[approve_payment]", error.code, error.message);

    // Map the failure to an action the admin can take.
    if (error.message.includes("does not belong to")) {
      return {
        error:
          "Pembayaran ini tertaut ke wedding milik akun lain. Periksa data payment sebelum menyetujui.",
      };
    }
    if (error.message.includes("Only payments pending review")) {
      return { error: "Pembayaran ini sudah diproses sebelumnya." };
    }
    if (error.message.includes("Not authorized")) {
      return { error: "Akun Anda bukan admin." };
    }
    if (error.message.includes("function") || error.code === "PGRST202") {
      return {
        error:
          "Fungsi approve_payment belum ada di database. Jalankan migrasi 016.",
      };
    }
    return {
      error: `Gagal menyetujui (${error.code ?? "?"}): ${error.message}`,
    };
  }

  revalidatePath("/admin/payments");
  return { success: "Pembayaran disetujui. Akses customer sudah aktif." };
}

export async function rejectPaymentAction(
  _prev: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  const id = text(formData, "paymentId");
  const reason = text(formData, "reason").slice(0, 500);
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: "Tidak memiliki akses admin." };

  const { error } = await ctx.supabase.rpc("reject_payment", {
    p_payment_id: id,
    p_reason: reason || null,
  });

  if (error) {
    console.error("[reject_payment]", error.code, error.message);
    return { error: `Gagal menolak (${error.code ?? "?"}): ${error.message}` };
  }

  revalidatePath("/admin/payments");
  return { success: "Pembayaran ditolak." };
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
