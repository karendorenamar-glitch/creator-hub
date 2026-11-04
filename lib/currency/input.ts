import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrencyCode } from "./currencies";
import type { RateTable } from "./rates";
import { getCurrencyContext, type CurrencyContext } from "./server";
import { loadCustomerCountry } from "@/lib/wedding/country";

export type InputConversion =
  | {
      ok: true;
      /** Value that should be stored in the existing IDR columns. */
      amountIdr: number;
      enteredAmount: number;
      enteredCurrency: CurrencyCode;
      rate: number;
      rateAt: string | null;
    }
  | { ok: false; error: string };

/** Round to whole rupiah; existing columns are numeric(14,0). */
function roundIdr(value: number): number {
  return Math.max(0, Math.round(value));
}

/** Convert an amount typed in the display currency into the stored IDR base. */
export function convertEnteredAmount(
  entered: number,
  currency: CurrencyCode,
  rates: RateTable | null,
): InputConversion {
  if (!Number.isFinite(entered) || entered < 0) {
    return { ok: false, error: "invalid-amount" };
  }

  if (currency === "IDR") {
    return {
      ok: true,
      amountIdr: roundIdr(entered),
      enteredAmount: entered,
      enteredCurrency: "IDR",
      rate: 1,
      rateAt: null,
    };
  }

  const rate = rates?.[currency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    // Never guess a rate: the caller must show an error instead of saving.
    return { ok: false, error: "rates-unavailable" };
  }

  return {
    ok: true,
    amountIdr: roundIdr(entered / rate),
    enteredAmount: entered,
    enteredCurrency: currency,
    rate,
    rateAt: null,
  };
}

export async function inputConversionContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<CurrencyContext> {
  const country = await loadCustomerCountry(supabase, userId);
  return getCurrencyContext(supabase, userId, country);
}

/** Convert a stored IDR base amount into the input currency for edit forms. */
export function toEnteredAmount(
  amountIdr: number,
  currency: CurrencyCode,
  rates: RateTable | null,
): number | null {
  if (currency === "IDR") return amountIdr;
  const rate = rates?.[currency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  return amountIdr * rate;
}
