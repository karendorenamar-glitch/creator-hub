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

/** Compact fee text for inputs: 1.5M, 500K, 750 */
export function formatCompactFee(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted =
      millions >= 10
        ? Math.round(millions).toString()
        : millions.toFixed(1).replace(/\.0$/, "");
    return `${formatted}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    const formatted =
      thousands >= 100
        ? Math.round(thousands).toString()
        : thousands.toFixed(thousands >= 10 ? 0 : 1).replace(/\.0$/, "");
    return `${formatted}K`;
  }

  return String(Math.round(value));
}

/** Parses compact fee input: 1.5M, 500K, Rp 1.2M, or plain digits */
export function parseCompactFee(
  value: string | number | null | undefined,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  }

  if (value == null) {
    return 0;
  }

  const trimmed = String(value).trim().replace(/^Rp\s*/i, "").replace(/,/g, "");
  if (!trimmed) {
    return 0;
  }

  const match = trimmed.match(/^([\d.]+)\s*([kKmM])?$/);
  if (match) {
    const num = Number.parseFloat(match[1]);
    if (!Number.isFinite(num)) {
      return 0;
    }

    const suffix = match[2]?.toLowerCase();
    if (suffix === "k") {
      return Math.round(num * 1_000);
    }
    if (suffix === "m") {
      return Math.round(num * 1_000_000);
    }

    return Math.round(num);
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}
