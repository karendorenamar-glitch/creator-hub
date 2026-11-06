"use server";

import { revalidatePath } from "next/cache";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadAffiliate } from "@/lib/affiliate/session";
import { text } from "@/lib/wedding/validation";

export type PayoutState = { error?: string; ok?: boolean } | null;

/** Requests a payout for one currency. The database validates the balance. */
export async function requestPayoutAction(
  _prev: PayoutState,
  formData: FormData,
): Promise<PayoutState> {
  const supabase = await createWeddingClient();
  const affiliate = await loadAffiliate(supabase);
  if (!affiliate) return { error: "Please sign in again." };
  if (affiliate.status !== "active") return { error: "This account is suspended." };

  const currency = text(formData, "currency").toUpperCase();
  if (currency !== "IDR" && currency !== "USD") return { error: "Pick a currency." };

  const amount = Number(text(formData, "amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const bank = text(formData, "bankName").trim();
  const holder = text(formData, "accountHolder").trim();
  const account = text(formData, "accountNumber").trim();
  if (!bank || !holder || account.length < 4) {
    return { error: "Bank name, account holder and account number are required." };
  }

  const { error } = await supabase.rpc("affiliate_request_payout", {
    p_currency: currency,
    p_amount: amount,
    p_bank: bank,
    p_holder: holder,
    p_account: account,
  });

  if (error) {
    const message = error.message;
    if (message.includes("Insufficient")) return { error: "Available balance is not enough." };
    if (message.includes("minimum")) {
      return { error: currency === "IDR" ? "Minimum payout is Rp6,000." : "Minimum payout is $0.60." };
    }
    console.error("[requestPayoutAction]", error.code, message);
    return { error: `Could not request the payout (${message}).` };
  }

  revalidatePath("/affiliate/dashboard");
  return { ok: true };
}
