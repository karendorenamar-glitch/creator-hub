"use client";

import { createContext, useContext, useMemo } from "react";
import { createMoneyFormatter, type MoneyFormatter } from "@/lib/currency/format";
import type { RateTable } from "@/lib/currency/rates";
import type { CurrencyCode } from "@/lib/currency/currencies";

const MoneyContext = createContext<MoneyFormatter | null>(null);

export function CurrencyProvider({
  currency,
  rates,
  ratesAvailable,
  fetchedAt,
  children,
}: {
  currency: CurrencyCode;
  rates: Record<string, number> | null;
  ratesAvailable: boolean;
  fetchedAt: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () =>
      createMoneyFormatter(
        currency,
        rates as RateTable | null,
        ratesAvailable,
        fetchedAt,
      ),
    [currency, rates, ratesAvailable, fetchedAt],
  );

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

/** Formats wedding amounts in the customer's chosen display currency. */
export function useMoney(): MoneyFormatter {
  const value = useContext(MoneyContext);
  if (value) return value;
  // Safe fallback for any component rendered outside the provider.
  return createMoneyFormatter("IDR", null, false, null);
}
