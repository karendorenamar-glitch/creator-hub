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

export function parseCount(value: string): number | null {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const count = Number(digits);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function isDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
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

/** Keeps the stored status consistent with the amounts. */
export function paymentStatusFor(
  amount: number,
  amountPaid: number,
): "unpaid" | "deposit_paid" | "partially_paid" | "paid" {
  if (amount > 0 && amountPaid >= amount) return "paid";
  if (amountPaid > 0) return "partially_paid";
  return "unpaid";
}

export function firstError(errors: (string | null | undefined)[]) {
  return errors.find((message): message is string => Boolean(message)) ?? null;
}
