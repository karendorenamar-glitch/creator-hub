import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/plan";

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function getTodayDateInJakarta() {
  return formatDateInJakarta(new Date());
}

export function formatDateInJakarta(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parsePaymentDateInJakarta(value: string) {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { error: "Enter a valid payment date." as const };
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(`${trimmed}T12:00:00+07:00`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return { error: "Enter a valid payment date." as const };
  }

  const today = getTodayDateInJakarta();
  if (trimmed > today) {
    return { error: "Payment date cannot be in the future." as const };
  }

  return { value: trimmed };
}

export function resolveSubscriptionEndsDate(paymentDate: string) {
  const date = new Date(`${paymentDate}T12:00:00+07:00`);
  date.setDate(date.getDate() + SUBSCRIPTION_PERIOD_DAYS);
  return formatDateInJakarta(date);
}

export function subscriptionEndsDateToIso(subscriptionEndsDate: string) {
  return `${subscriptionEndsDate}T23:59:59.999+07:00`;
}

export function isSubscriptionEndDatePassed(subscriptionEndsDate: string) {
  return Date.now() > new Date(subscriptionEndsDateToIso(subscriptionEndsDate)).getTime();
}
