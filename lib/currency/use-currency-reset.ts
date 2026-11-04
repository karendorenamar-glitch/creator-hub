"use client";

import { useEffect, useRef } from "react";
import { useMoney } from "@/components/wedding/currency-provider";

/**
 * Runs `onChange` once after every successful currency switch.
 *
 * Financial modals use it to close themselves: an amount typed under the old
 * currency must never be submitted under the new one.
 */
export function useCurrencyReset(onChange: () => void) {
  const money = useMoney();
  // Watch the currency itself instead of the success counter: the switch is
  // optimistic, so the form closes the moment the value the user is looking at
  // changes, including while the preference is still being saved.
  const seen = useRef(money.currency);

  useEffect(() => {
    if (money.currency === seen.current) return;
    seen.current = money.currency;
    onChange();
  }, [money.currency, onChange]);
}
