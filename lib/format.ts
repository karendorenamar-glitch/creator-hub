/**
 * Formats IDR budget/fee amounts as compact Rp K / M labels for display.
 * Examples: Rp 500, Rp 50K, Rp 1.2M
 */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "Rp 0";
  if (value === 0) return "Rp 0";

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted =
      millions >= 10
        ? Math.round(millions).toString()
        : millions.toFixed(1).replace(/\.0$/, "");
    return `${sign}Rp ${formatted}M`;
  }

  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const formatted =
      thousands >= 100
        ? Math.round(thousands).toString()
        : thousands.toFixed(thousands >= 10 ? 0 : 1).replace(/\.0$/, "");
    return `${sign}Rp ${formatted}K`;
  }

  return `${sign}Rp ${Math.round(abs).toLocaleString("id-ID")}`;
}
