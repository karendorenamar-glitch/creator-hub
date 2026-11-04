import type { SupabaseClient } from "@supabase/supabase-js";
import { convertEnteredAmount, inputConversionContext } from "./input";
import type { CurrencyCode } from "./currencies";

export type FinancialModule =
  | "wedding_budget"
  | "budget_category"
  | "vendor"
  | "vendor_option"
  | "vendor_payment"
  | "expense"
  | "other_cost"
  | "donation"
  | "allocation";

export type InputAmounts = {
  currency: CurrencyCode;
  rate: number;
  rateAt: string | null;
  entered: number[];
  idr: number[];
};

/**
 * Converts the numbers a customer typed in their display currency into the IDR
 * base stored by the existing columns. Returns null when rates are unavailable
 * so callers can refuse to save instead of guessing.
 */
export async function convertInputAmounts(
  supabase: SupabaseClient,
  userId: string,
  amounts: number[],
): Promise<InputAmounts | null> {
  const context = await inputConversionContext(supabase, userId);
  const idr: number[] = [];
  let rate = 1;

  for (const amount of amounts) {
    const converted = convertEnteredAmount(amount, context.currency, context.rates as never);
    if (!converted.ok) return null;
    idr.push(converted.amountIdr);
    rate = converted.rate;
  }

  return {
    currency: context.currency,
    rate,
    rateAt: context.fetchedAt,
    entered: amounts,
    idr,
  };
}

/** Keeps the typed amount, currency and FX rate for one financial record. */
export async function recordFinancialEntry(
  supabase: SupabaseClient,
  input: {
    userId: string;
    module: FinancialModule;
    recordId: string;
    amounts: InputAmounts;
  },
): Promise<void> {
  const { error } = await supabase.from("financial_entries").upsert(
    {
      user_id: input.userId,
      module: input.module,
      record_id: input.recordId,
      entered_amount: input.amounts.entered[0] ?? 0,
      entered_currency: input.amounts.currency,
      fx_rate: input.amounts.rate,
      fx_rate_at: input.amounts.rateAt,
    },
    { onConflict: "module,record_id" },
  );

  if (error) {
    console.error("[currency] audit write failed", error.code, error.message);
  }
}

/** Convert using an explicit currency (first Target Budget entry). */
export async function convertAmountsWithCurrency(
  supabase: SupabaseClient,
  currency: CurrencyCode,
  amounts: number[],
): Promise<InputAmounts | null> {
  void supabase;
  const { getExchangeRates } = await import("./rates");
  const exchange = await getExchangeRates();
  if (currency !== "IDR" && (!exchange.available || !exchange.rates)) {
    return null;
  }

  const idr: number[] = [];
  let rate = 1;
  for (const amount of amounts) {
    const converted = convertEnteredAmount(amount, currency, exchange.rates as never);
    if (!converted.ok) return null;
    idr.push(converted.amountIdr);
    rate = converted.rate;
  }

  return {
    currency,
    rate,
    rateAt: exchange.fetchedAt,
    entered: amounts,
    idr,
  };
}

/**
 * True when the form was rendered with a different display currency than the
 * one stored right now (another tab changed it, or the page is stale).
 * No stored preference means nothing can be stale.
 */
export async function submittedCurrencyIsStale(
  supabase: SupabaseClient,
  userId: string,
  submitted: string | null | undefined,
): Promise<boolean> {
  if (!submitted) return false;
  const { data } = await supabase
    .from("customer_currency_preferences")
    .select("display_currency")
    .eq("user_id", userId)
    .maybeSingle();
  const stored = (data as { display_currency?: string } | null)?.display_currency;
  if (!stored) return false;
  return stored !== submitted;
}
