"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/wedding/admin";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { text } from "@/lib/wedding/validation";

async function finish() {
  revalidatePath("/admin/affiliate-payouts");
  revalidatePath("/admin/affiliates");
}

export async function markPayoutProcessing(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "payoutId");
  const supabase = await createWeddingClient();
  const { error } = await supabase.rpc("affiliate_payout_processing", { p_payout: id });
  if (error) console.error("[markPayoutProcessing]", error.message);
  await finish();
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "payoutId");
  const transferDate = text(formData, "transferDate");
  const reference = text(formData, "transferReference");
  const rateRaw = text(formData, "exchangeRate");
  const note = text(formData, "note");

  const supabase = await createWeddingClient();
  const { error } = await supabase.rpc("affiliate_payout_paid", {
    p_payout: id,
    p_transfer_date: transferDate || null,
    p_reference: reference,
    p_rate: rateRaw ? Number(rateRaw) : null,
    p_note: note || null,
  });
  if (error) console.error("[markPayoutPaid]", error.message);
  await finish();
}

export async function rejectPayout(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "payoutId");
  const reason = text(formData, "reason");
  const supabase = await createWeddingClient();
  const { error } = await supabase.rpc("affiliate_payout_reject", {
    p_payout: id,
    p_reason: reason,
  });
  if (error) console.error("[rejectPayout]", error.message);
  await finish();
}
