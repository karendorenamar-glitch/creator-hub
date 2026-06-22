"use server";

import { createClient } from "@/lib/supabase/server";
import {
  preparePayoutInsert,
  validatePayoutUpdate,
  type PayoutInput,
  type PayoutStatus,
  type PayoutUpdateInput,
} from "@/lib/payouts";
import { revalidatePayouts } from "@/lib/revalidate";
import { normalizeProofUrl } from "@/lib/payout-invoice";
import type { Payout } from "@/types/database";

const payoutSelect =
  "id, creator_id, campaign_id, amount, status, requested_at, due_date, payment_term_days, notes, proof_url, created_at, creators(name), campaigns(name)";

function parsePayoutInput(input: PayoutInput) {
  if (!input.creator_id?.trim()) {
    return { error: "Creator is required." };
  }

  if (input.amount == null || input.amount <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  return {
    payload: preparePayoutInsert(input),
  };
}

export async function createPayout(input: PayoutInput) {
  const supabase = await createClient();
  const parsed = parsePayoutInput(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { data, error } = await supabase
    .from("payouts")
    .insert(parsed.payload)
    .select(payoutSelect)
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePayouts();
  return { data: data as Payout };
}

export async function updatePayout(input: PayoutUpdateInput) {
  const supabase = await createClient();
  const parsed = validatePayoutUpdate(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { data, error } = await supabase
    .from("payouts")
    .update(parsed.payload)
    .eq("id", input.id)
    .select(payoutSelect)
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePayouts();
  return { data: data as Payout };
}

export async function updatePayoutStatus(id: string, status: PayoutStatus) {
  const supabase = await createClient();

  const { error } = await supabase.from("payouts").update({ status }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePayouts();
  return { success: true };
}

export async function deletePayout(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("payouts").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePayouts();
  return { success: true };
}

export async function savePayoutProofUrl(payoutId: string, proofUrl: string) {
  if (!payoutId?.trim()) {
    return { error: "Payout is required." };
  }

  const normalizedProofUrl = normalizeProofUrl(proofUrl);

  if (!normalizedProofUrl) {
    return { error: "A valid invoice URL is required." };
  }

  console.log("[invoice-upload] save_proof_url_request", {
    payoutId,
    proofUrl: normalizedProofUrl,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payouts")
    .update({ proof_url: normalizedProofUrl })
    .eq("id", payoutId)
    .select(payoutSelect)
    .single();

  if (error) {
    console.error("[invoice-upload] save_proof_url_error", {
      payoutId,
      proofUrl: normalizedProofUrl,
      error,
    });
    return { error: error.message };
  }

  console.log("[invoice-upload] save_proof_url_response", {
    payoutId,
    proofUrl: normalizedProofUrl,
    payoutStatus: (data as Payout | null)?.status ?? null,
  });

  revalidatePayouts();
  return { proof_url: normalizedProofUrl, data: data as Payout };
}
