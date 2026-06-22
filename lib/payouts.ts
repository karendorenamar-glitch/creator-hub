export const DEFAULT_PAYMENT_TERM_DAYS = 30;

export type PayoutStatus = "PENDING" | "PAID" | "CANCELLED";

export type PayoutTimingBadge = "on_time" | "due_today" | "overdue" | "paid";

export type PayoutInput = {
  creator_id: string;
  campaign_id?: string | null;
  amount: number;
  status?: PayoutStatus;
  requested_at?: string | null;
  due_date?: string | null;
  payment_term_days?: number | null;
  notes?: string;
};

export type PayoutUpdateInput = {
  id: string;
  requested_at: string;
  amount: number;
  payment_term_days: number;
  due_date: string;
  status: PayoutStatus;
  notes?: string;
};

export type PayoutTiming = {
  daysLeft: number | null;
  isOverdue: boolean;
  badge: PayoutTimingBadge | null;
  timingLabel: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTodayDateOnly(reference = new Date()) {
  return toDateOnlyString(reference);
}

export function toDateOnlyString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string) {
  const parsed = parsePayoutDate(value);
  if (!parsed) {
    return startOfDay(new Date());
  }
  return parsed;
}

export function parsePayoutDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const datePart = trimmed.slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("-").map(Number);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }

    const parsed = new Date(year, month - 1, day);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return startOfDay(parsed);
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return startOfDay(parsed);
}

export function resolveEffectiveDueDate(input: {
  dueDate?: string | null;
  requestedAt?: string | null;
  paymentTermDays?: number | null;
}): Date | null {
  const due = parsePayoutDate(input.dueDate);
  if (due) {
    return due;
  }

  const requested = parsePayoutDate(input.requestedAt);
  if (!requested) {
    return null;
  }

  const paymentTermDays = input.paymentTermDays ?? DEFAULT_PAYMENT_TERM_DAYS;
  if (!Number.isFinite(paymentTermDays)) {
    return null;
  }

  return addDaysToDate(requested, paymentTermDays);
}

export function getPayoutTimingLabel(input: {
  daysLeft: number | null;
  status: PayoutStatus;
}): { label: string; badge: PayoutTimingBadge | null } {
  if (input.status === "PAID") {
    return { label: "PAID", badge: "paid" };
  }

  if (input.daysLeft == null || Number.isNaN(input.daysLeft)) {
    return { label: "-", badge: null };
  }

  if (input.daysLeft < 0) {
    return {
      label: `OVERDUE • ${Math.abs(input.daysLeft)} days late`,
      badge: "overdue",
    };
  }

  if (input.daysLeft === 0) {
    return { label: "DUE TODAY", badge: "due_today" };
  }

  return {
    label: `ON TIME • ${input.daysLeft} days left`,
    badge: "on_time",
  };
}

export function addDaysToDate(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Single source of truth for payout due dates.
 * Used once when preparing create/update payloads — never duplicated in UI.
 */
export function resolvePayoutDueDate(input: {
  requestedAt: string;
  dueDate?: string | null;
  paymentTermDays?: number | null;
}) {
  const trimmedDueDate = input.dueDate?.trim();
  if (trimmedDueDate) {
    const parsedDueDate = parsePayoutDate(trimmedDueDate);
    if (parsedDueDate) {
      return toDateOnlyString(parsedDueDate);
    }
  }

  const paymentTermDays = input.paymentTermDays ?? DEFAULT_PAYMENT_TERM_DAYS;
  const requestedAt =
    parsePayoutDate(input.requestedAt) ?? startOfDay(new Date());

  return toDateOnlyString(addDaysToDate(requestedAt, paymentTermDays));
}

export function computePayoutTiming(input: {
  dueDate?: string | null;
  requestedAt?: string | null;
  paymentTermDays?: number | null;
  status: PayoutStatus;
  today?: Date;
}): PayoutTiming {
  const today = startOfDay(input.today ?? new Date());
  const due = resolveEffectiveDueDate({
    dueDate: input.dueDate,
    requestedAt: input.requestedAt,
    paymentTermDays: input.paymentTermDays,
  });

  if (!due) {
    return {
      daysLeft: null,
      isOverdue: false,
      badge: null,
      timingLabel: "-",
    };
  }

  const daysLeft = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (Number.isNaN(daysLeft)) {
    return {
      daysLeft: null,
      isOverdue: false,
      badge: null,
      timingLabel: "-",
    };
  }

  const { label, badge } = getPayoutTimingLabel({
    daysLeft,
    status: input.status,
  });

  return {
    daysLeft,
    isOverdue: input.status !== "PAID" && daysLeft < 0,
    badge,
    timingLabel: label,
  };
}

export function preparePayoutInsert(input: PayoutInput) {
  const requestedAtDate =
    parsePayoutDate(input.requested_at) ?? startOfDay(new Date());
  const requestedAt = toDateOnlyString(requestedAtDate);
  const paymentTermDays = input.payment_term_days ?? DEFAULT_PAYMENT_TERM_DAYS;
  const dueDate = resolvePayoutDueDate({
    requestedAt,
    dueDate: input.due_date,
    paymentTermDays,
  });

  return {
    creator_id: input.creator_id,
    campaign_id: input.campaign_id?.trim() || null,
    amount: Math.max(0, Math.trunc(input.amount)),
    status: input.status ?? ("PENDING" as PayoutStatus),
    requested_at: requestedAt,
    due_date: dueDate,
    payment_term_days: paymentTermDays,
    notes: input.notes?.trim() ?? "",
  };
}

export function validatePayoutUpdate(input: PayoutUpdateInput) {
  if (!input.id?.trim()) {
    return { error: "Payout is required." };
  }

  if (
    input.amount == null ||
    typeof input.amount !== "number" ||
    Number.isNaN(input.amount) ||
    input.amount <= 0
  ) {
    return { error: "Amount must be a number greater than zero." };
  }

  if (
    input.payment_term_days == null ||
    typeof input.payment_term_days !== "number" ||
    Number.isNaN(input.payment_term_days) ||
    input.payment_term_days < 0
  ) {
    return { error: "Payment term must be a valid number." };
  }

  const requestedDate = parsePayoutDate(input.requested_at);
  const dueDate = parsePayoutDate(input.due_date);

  if (!requestedDate) {
    return { error: "Requested date is invalid." };
  }

  if (!dueDate) {
    return { error: "Due date is required." };
  }

  if (dueDate.getTime() < requestedDate.getTime()) {
    return { error: "Due date cannot be before requested date." };
  }

  return {
    payload: {
      amount: Math.max(0, Math.trunc(input.amount)),
      payment_term_days: Math.trunc(input.payment_term_days),
      due_date: toDateOnlyString(dueDate),
      status: input.status,
      notes: input.notes?.trim() ?? "",
    },
  };
}

export function enrichPayout<
  T extends {
    due_date: string | null | undefined;
    requested_at: string;
    payment_term_days: number;
    status: PayoutStatus;
  },
>(payout: T, today?: Date) {
  const timing = computePayoutTiming({
    dueDate: payout.due_date,
    requestedAt: payout.requested_at,
    paymentTermDays: payout.payment_term_days,
    status: payout.status,
    today,
  });

  return {
    ...payout,
    daysLeft: timing.daysLeft,
    isOverdue: timing.isOverdue,
    timingBadge: timing.badge,
    timingLabel: timing.timingLabel,
  };
}
