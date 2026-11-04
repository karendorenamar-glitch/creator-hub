import { currencyOption, type CurrencyCode } from "./currencies";
import type { RateTable } from "./rates";

/** Convert an IDR amount into the display currency. */
export function convertFromIDR(
  amountIdr: number | null | undefined,
  currency: CurrencyCode,
  rates: RateTable | null,
): number | null {
  const amount =
    typeof amountIdr === "number" && Number.isFinite(amountIdr)
      ? amountIdr
      : 0;
  if (currency === "IDR") return amount;
  const rate = rates?.[currency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  return amount * rate;
}

/** Locale-aware formatting with the right decimal precision per currency. */
export function formatCurrencyAmount(
  value: number,
  currency: CurrencyCode,
): string {
  const option = currencyOption(currency);
  return new Intl.NumberFormat(option.locale, {
    style: "currency",
    currency: option.code,
    minimumFractionDigits: option.decimals,
    maximumFractionDigits: option.decimals,
  }).format(value);
}

export type MoneyFormatter = {
  currency: CurrencyCode;
  /** True when the shown value was converted from IDR. */
  converted: boolean;
  ratesAvailable: boolean;
  fetchedAt: string | null;
  format: (amountIdr: number | null | undefined) => string;
  formatOriginal: (amountIdr: number | null | undefined) => string;
};

export function createMoneyFormatter(
  currency: CurrencyCode,
  rates: RateTable | null,
  ratesAvailable: boolean,
  fetchedAt: string | null,
): MoneyFormatter {
  const formatOriginal = (amountIdr: number | null | undefined) =>
    formatCurrencyAmount(
      typeof amountIdr === "number" && Number.isFinite(amountIdr) ? amountIdr : 0,
      "IDR",
    );

  return {
    currency,
    converted: currency !== "IDR" && ratesAvailable,
    ratesAvailable,
    fetchedAt,
    formatOriginal,
    format: (amountIdr) => {
      if (currency === "IDR") return formatOriginal(amountIdr);
      const converted = convertFromIDR(amountIdr, currency, rates);
      // Never show a wrong number: fall back to the original currency.
      if (converted === null) return formatOriginal(amountIdr);
      return formatCurrencyAmount(converted, currency);
    },
  };
}
