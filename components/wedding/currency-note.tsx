"use client";

import { useMoney } from "@/components/wedding/currency-provider";

/**
 * Small "converted from IDR" note. Lives on the client so it follows a
 * currency switch immediately instead of waiting for a server render.
 */
export function CurrencyConversionNote() {
  const money = useMoney();
  if (money.currency === "IDR") return null;

  return (
    <p className="text-xs text-ink-soft">
      {money.converted
        ? `Converted from IDR${
            money.fetchedAt
              ? ` · rates updated ${money.fetchedAt.slice(0, 10)}`
              : ""
          }`
        : "Exchange rates are unavailable right now — amounts are shown in IDR."}
    </p>
  );
}
