"use client";

import { useMoney } from "@/components/wedding/currency-provider";

/**
 * Carries the currency the customer is actually looking at when a money form
 * is submitted. Server actions reject the save when it no longer matches the
 * stored preference, which is the only reliable guard against another tab (or
 * a stale page) writing a display amount under the wrong currency.
 */
export function CurrencyField() {
  const money = useMoney();
  return <input type="hidden" name="displayCurrency" value={money.currency} />;
}
