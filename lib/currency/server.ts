import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_CURRENCY,
  defaultCurrencyForCountry,
  isCurrencyCode,
  type CurrencyCode,
} from "./currencies";
import { createMoneyFormatter, type MoneyFormatter } from "./format";
import { getExchangeRates } from "./rates";

export type CurrencyContext = {
  currency: CurrencyCode;
  rates: Record<string, number> | null;
  ratesAvailable: boolean;
  fetchedAt: string | null;
};

/** Saved preference, otherwise the country default (ID → IDR, others → USD). */
export async function resolveDisplayCurrency(
  supabase: SupabaseClient,
  userId: string,
  country: string | null,
): Promise<CurrencyCode> {
  const { data } = await supabase
    .from("customer_currency_preferences")
    .select("display_currency")
    .eq("user_id", userId)
    .maybeSingle();

  const stored = (data as { display_currency?: string } | null)?.display_currency;
  if (isCurrencyCode(stored)) return stored;

  return country ? defaultCurrencyForCountry(country) : DEFAULT_CURRENCY;
}

export async function getCurrencyContext(
  supabase: SupabaseClient,
  userId: string,
  country: string | null,
): Promise<CurrencyContext> {
  const [currency, exchange] = await Promise.all([
    resolveDisplayCurrency(supabase, userId, country),
    getExchangeRates(),
  ]);

  return {
    currency,
    rates: exchange.rates,
    ratesAvailable: exchange.available,
    fetchedAt: exchange.fetchedAt,
  };
}

export function moneyFromContext(context: CurrencyContext): MoneyFormatter {
  return createMoneyFormatter(
    context.currency,
    context.rates as never,
    context.ratesAvailable,
    context.fetchedAt,
  );
}

export async function getMoneyFormatter(
  supabase: SupabaseClient,
  userId: string,
  country: string | null,
): Promise<MoneyFormatter & { context: CurrencyContext }> {
  const context = await getCurrencyContext(supabase, userId, country);
  return { ...moneyFromContext(context), context };
}

/** True when the customer already picked a currency (Settings or budget). */
export async function hasStoredCurrencyPreference(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("customer_currency_preferences")
    .select("display_currency")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean((data as { display_currency?: string } | null)?.display_currency);
}

export async function saveCurrencyPreference(
  supabase: SupabaseClient,
  userId: string,
  currency: CurrencyCode,
): Promise<boolean> {
  const { error } = await supabase
    .from("customer_currency_preferences")
    .upsert(
      { user_id: userId, display_currency: currency },
      { onConflict: "user_id" },
    );
  if (error) {
    console.error("[currency] preference save failed", error.code, error.message);
    return false;
  }
  return true;
}
