/** Server-side parsing and validation helpers for wedding forms. */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(
  formData: FormData,
  key: string,
  maxLength: number,
): string | null {
  const value = text(formData, key);
  if (!value) return null;
  return value.slice(0, maxLength);
}

/** Digits only; returns null for empty or non-numeric input. */
export function parseMoney(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : null;
}

/**
 * Strict whole-Rupiah parser for new payments, agreed prices, and target
 * budgets. Accepts digits with optional thousand separators; rejects negative
 * signs, scientific notation, letters, and amounts outside numeric(14,0).
 */
export function parseWholeRupiah(
  value: string,
  options: { allowZero?: boolean } = {},
): number | null {
  const allowZero = options.allowZero ?? true;
  const normalized = value.trim().replace(/\./g, "").replace(/\s/g, "");
  if (!/^\d+$/.test(normalized)) return null;

  const amount = Number(normalized);
  if (!Number.isSafeInteger(amount) || amount > 99_999_999_999_999) {
    return null;
  }
  if (!allowZero && amount <= 0) return null;
  return amount;
}

/**
 * Payment amount posted by the payment modal (`paymentAmount`), with a fallback
 * to the legacy field name (`amount`). Requires a positive whole Rupiah value.
 */
export function readPaymentAmount(formData: FormData): number | null {
  return parseWholeRupiah(
    text(formData, "paymentAmount") || text(formData, "amount"),
    { allowZero: false },
  );
}

export function parseCount(value: string): number | null {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const count = Number(digits);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isDateString(value: string): boolean {
  return isRealDate(value);
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Null id when the field is empty; null-safe for optional relations. */
export function optionalUuid(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value && isUuid(value) ? value : null;
}

export function enumValue<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = text(formData, key) as T;
  return allowed.includes(value) ? value : fallback;
}

/** Keeps the expense status consistent with its amounts (legacy expenses). */
export function paymentStatusFor(
  amount: number,
  amountPaid: number,
): "diskusi" | "dp" | "lunas" {
  if (amount > 0 && amountPaid >= amount) return "lunas";
  if (amountPaid > 0) return "dp";
  return "diskusi";
}

export function firstError(errors: (string | null | undefined)[]) {
  return errors.find((message): message is string => Boolean(message)) ?? null;
}
