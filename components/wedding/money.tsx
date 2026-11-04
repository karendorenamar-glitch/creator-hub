"use client";

import { useMoney } from "@/components/wedding/currency-provider";

/** Renders an IDR amount in the customer's chosen display currency. */
export function Money({ value }: { value: number | null | undefined }) {
  const money = useMoney();
  return <>{money.format(value)}</>;
}
