import type { DebtAccount, DebtPayment, DebtSchedule } from "./db-types";

const DAY_MS = 86_400_000;

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function daysUntil(iso: string, today: string): number {
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${iso}T00:00:00Z`);
  return Math.round((end - start) / DAY_MS);
}

function percentOf(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

export type InstallmentStatus =
  | "upcoming"
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type Installment = {
  schedule: DebtSchedule;
  account: DebtAccount;
  paid: number;
  remaining: number;
  status: InstallmentStatus;
};

export type AccountSummary = DebtAccount & {
  original: number;
  scheduled: number;
  paid: number;
  remaining: number;
  progress: number;
  installmentCount: number;
  paidInstallments: number;
  openInstallments: number;
  overdueInstallments: number;
  nextInstallment: Installment | null;
  mismatch: boolean;
  /** Amount per remaining month, in due-date order. */
  monthlyAmounts: number[];
  /** True while the debt still relies on the older tenor columns. */
  legacy: boolean;
};

export type MonthCounts = {
  paid: number;
  partially_paid: number;
  unpaid: number;
  overdue: number;
  upcoming: number;
};

export type MonthSummary = {
  month: string;
  scheduled: number;
  paid: number;
  remaining: number;
  overdueAmount: number;
  counts: MonthCounts;
  installments: Installment[];
  payments: DebtPayment[];
};

export type DebtTotals = {
  originalTotal: number;
  totalPaid: number;
  remaining: number;
  progress: number;
  overdueCount: number;
  overdueAmount: number;
  overdueAccounts: AccountSummary[];
  dueSoonCount: number;
  dueSoonInstallments: Installment[];
  monthlyTarget: number;
  monthlyPaid: number;
  monthlyLabelKey: string;
};

export function activePayments(payments: DebtPayment[]): DebtPayment[] {
  return payments.filter((payment) => !payment.reversed_at);
}

/** Amount already paid for each installment, excluding reversed payments. */
export function paidByScheduleId(
  payments: DebtPayment[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const payment of activePayments(payments)) {
    if (!payment.schedule_id) continue;
    map.set(
      payment.schedule_id,
      (map.get(payment.schedule_id) ?? 0) + Number(payment.amount),
    );
  }
  return map;
}

/**
 * Installment status is derived from recorded payments and the due date.
 * Opening a month never changes it; only a recorded payment can.
 */
export function deriveInstallmentStatus(
  schedule: Pick<DebtSchedule, "status" | "due_date" | "amount_due">,
  paid: number,
  today = todayISO(),
): InstallmentStatus {
  if (schedule.status === "cancelled") return "cancelled";
  const amount = Number(schedule.amount_due);
  const remaining = Math.max(0, amount - paid);
  if (remaining === 0) return "paid";
  if (schedule.due_date < today) return "overdue";
  if (paid > 0) return "partially_paid";
  return monthKey(schedule.due_date) <= monthKey(today) ? "unpaid" : "upcoming";
}

export function buildInstallments(
  accounts: DebtAccount[],
  schedules: DebtSchedule[],
  payments: DebtPayment[],
  today = todayISO(),
): Installment[] {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const paidMap = paidByScheduleId(payments);

  return schedules
    .map((schedule) => {
      const account = accountsById.get(schedule.debt_account_id);
      if (!account) return null;
      const paid = paidMap.get(schedule.id) ?? 0;
      return {
        schedule,
        account,
        paid,
        remaining: Math.max(0, Number(schedule.amount_due) - paid),
        status: deriveInstallmentStatus(schedule, paid, today),
      };
    })
    .filter((item): item is Installment => item !== null)
    .sort((a, b) => a.schedule.due_date.localeCompare(b.schedule.due_date));
}

function dueDateForDay(day: number, today: string): string {
  const [year, month] = today.split("-").map(Number);
  const pad = (value: number) => String(value).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const current = `${year}-${pad(month)}-${pad(Math.min(day, lastDay))}`;
  if (current >= today) return current;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastNext = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  return `${nextYear}-${pad(nextMonth)}-${pad(Math.min(day, lastNext))}`;
}

/**
 * Reads the pre-schedule tenor columns so existing debts keep their numbers
 * after the switch to the installment-schedule model. It disappears as soon as
 * the debt has real installment rows.
 */
function legacySummary(
  account: DebtAccount,
  payments: DebtPayment[],
  today: string,
): AccountSummary | null {
  const amount = Number(account.installment_amount ?? 0);
  const totalMonths = Number(account.installment_total_months ?? 0);
  if (!(amount > 0) || !(totalMonths > 0)) return null;

  const paidMonths = Math.min(
    Math.max(Number(account.installment_month ?? 0), 0),
    totalMonths,
  );
  const openMonths = totalMonths - paidMonths;
  const recordedPaid = activePayments(payments)
    .filter((payment) => payment.debt_account_id === account.id)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const scheduledPaid = amount * paidMonths;
  const paid = Math.max(recordedPaid, scheduledPaid);
  const remaining = Math.max(0, amount * openMonths);
  const contract = Number(account.total_amount_due);
  const original = contract > 0 ? contract : amount * totalMonths;
  const dueDate =
    account.due_date ??
    (account.due_day ? dueDateForDay(Number(account.due_day), today) : null);
  const nextStatus =
    dueDate && dueDate < today ? ("overdue" as const) : ("upcoming" as const);
  const nextInstallment: Installment | null =
    openMonths > 0
      ? {
          schedule: {
            id: "",
            owner_user_id: account.owner_user_id,
            debt_account_id: account.id,
            due_date: dueDate ?? today,
            amount_due: amount,
            status: "upcoming",
            notes: null,
            created_at: account.created_at,
            updated_at: account.updated_at,
          },
          account,
          paid: 0,
          remaining: amount,
          status: nextStatus,
        }
      : null;

  return {
    ...account,
    original,
    scheduled: amount * totalMonths,
    paid,
    remaining,
    progress: percentOf(paid, paid + remaining),
    installmentCount: totalMonths,
    paidInstallments: paidMonths,
    openInstallments: openMonths,
    overdueInstallments: nextStatus === "overdue" ? 1 : 0,
    nextInstallment,
    mismatch: contract > 0 && amount * totalMonths !== contract,
    monthlyAmounts: Array.from({ length: openMonths }, () => amount),
    legacy: true,
  };
}

/**
 * Debts saved with only an original amount and payments, without any tenor or
 * installments, still keep their balance visible.
 */
function singleAmountSummary(
  account: DebtAccount,
  payments: DebtPayment[],
  today: string,
): AccountSummary | null {
  const contract = Number(account.total_amount_due ?? 0);
  if (!(contract > 0)) return null;

  const paid = activePayments(payments)
    .filter((payment) => payment.debt_account_id === account.id)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(0, contract - paid);
  const dueDate = account.due_date;
  const nextStatus =
    dueDate && dueDate < today ? ("overdue" as const) : ("upcoming" as const);
  const nextInstallment: Installment | null =
    remaining > 0
      ? {
          schedule: {
            id: "",
            owner_user_id: account.owner_user_id,
            debt_account_id: account.id,
            due_date: dueDate ?? today,
            amount_due: remaining,
            status: "upcoming",
            notes: null,
            created_at: account.created_at,
            updated_at: account.updated_at,
          },
          account,
          paid,
          remaining,
          status: nextStatus,
        }
      : null;

  return {
    ...account,
    original: contract,
    scheduled: contract,
    paid,
    remaining,
    progress: percentOf(paid, contract),
    installmentCount: 0,
    paidInstallments: 0,
    openInstallments: remaining > 0 ? 1 : 0,
    overdueInstallments: nextStatus === "overdue" ? 1 : 0,
    nextInstallment,
    mismatch: false,
    monthlyAmounts: remaining > 0 ? [remaining] : [],
    legacy: true,
  };
}

/**
 * The monthly tenor is the only thing the user maintains: nominal per month,
 * months already paid, and the next due date. Everything else is derived.
 */
function tenorSummary(
  account: DebtAccount,
  payments: DebtPayment[],
  today: string,
): AccountSummary {
  const monthly = Number(account.installment_amount ?? 0);
  const months = Number(account.installment_total_months ?? 0);
  const paidMonths = Math.min(
    Math.max(Number(account.installment_month ?? 0), 0),
    months,
  );
  const openMonths = months - paidMonths;
  const recordedPaid = activePayments(payments)
    .filter((payment) => payment.debt_account_id === account.id)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const scheduledPaid = monthly * paidMonths;
  const paid = Math.max(recordedPaid, scheduledPaid);
  const contract = Number(account.total_amount_due);
  const fullContract = monthly * months;
  const remaining = Math.max(0, fullContract - paid);
  const original = Math.max(contract, fullContract);
  const dueDate = account.due_date;
  const overdue = Boolean(dueDate && dueDate < today && remaining > 0);
  const nextInstallment: Installment | null =
    openMonths > 0
      ? {
          schedule: {
            id: "",
            owner_user_id: account.owner_user_id,
            debt_account_id: account.id,
            due_date: dueDate ?? today,
            amount_due: Math.min(monthly, remaining),
            status: "upcoming",
            notes: null,
            created_at: account.created_at,
            updated_at: account.updated_at,
          },
          account,
          paid: 0,
          remaining: Math.min(monthly, remaining),
          status: overdue ? "overdue" : "upcoming",
        }
      : null;

  return {
    ...account,
    original,
    scheduled: fullContract,
    paid,
    remaining,
    progress: percentOf(paid, paid + remaining),
    installmentCount: months,
    paidInstallments: paidMonths,
    openInstallments: openMonths,
    overdueInstallments: overdue ? 1 : 0,
    nextInstallment,
    mismatch: false,
    monthlyAmounts: Array.from({ length: openMonths }, () => monthly),
    legacy: false,
  };
}

export function summarizeAccount(
  account: DebtAccount,
  installments: Installment[],
  payments: DebtPayment[],
  today = todayISO(),
): AccountSummary {
  const tenorMonths = Number(account.installment_total_months ?? 0);
  const tenorAmount = Number(account.installment_amount ?? 0);
  const hasSchedules = installments.some(
    (item) =>
      item.schedule.debt_account_id === account.id &&
      item.status !== "cancelled",
  );
  // A debt with its own per-month amounts uses those rows; otherwise the single
  // monthly nominal plus tenor is the source of truth.
  if (
    account.status !== "closed" &&
    !hasSchedules &&
    tenorMonths > 0 &&
    tenorAmount > 0
  ) {
    return tenorSummary(account, payments, today);
  }

  const own = installments.filter(
    (item) =>
      item.schedule.debt_account_id === account.id &&
      item.status !== "cancelled",
  );
  const scheduled = own.reduce(
    (sum, item) => sum + Number(item.schedule.amount_due),
    0,
  );
  const remaining = own.reduce((sum, item) => sum + item.remaining, 0);
  const recordedPaid = activePayments(payments)
    .filter((payment) => payment.debt_account_id === account.id)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  if (own.length === 0 && account.status !== "closed") {
    const legacy = legacySummary(account, payments, today);
    if (legacy) return legacy;
    const single = singleAmountSummary(account, payments, today);
    if (single) return single;
  }

  const contract = Number(account.total_amount_due);
  // Without a contract total the schedule itself defines the original debt.
  const original = contract > 0 ? contract : scheduled;
  // Months already paid when the debt was created have no payment rows, so the
  // paid part is whatever the remaining installments do not cover.
  const paidFromContract =
    contract > 0 && Number(account.installment_month ?? 0) > 0
      ? Math.max(0, contract - remaining)
      : 0;
  const paid = Math.max(recordedPaid, paidFromContract);
  const base = paid + remaining;

  return {
    ...account,
    original,
    scheduled,
    paid,
    remaining,
    progress: percentOf(paid, base > 0 ? base : original),
    installmentCount: own.length,
    paidInstallments: own.filter((item) => item.status === "paid").length,
    openInstallments: own.filter((item) => item.remaining > 0).length,
    overdueInstallments: own.filter((item) => item.status === "overdue").length,
    nextInstallment: own.find((item) => item.remaining > 0) ?? null,
    mismatch: contract > 0 && scheduled > contract,
    monthlyAmounts: own
      .filter((item) => item.remaining > 0)
      .map((item) => Number(item.schedule.amount_due)),
    legacy: false,
  };
}

export function buildAccountSummaries(
  accounts: DebtAccount[],
  payments: DebtPayment[],
  schedules: DebtSchedule[] = [],
  today = todayISO(),
): AccountSummary[] {
  const installments = buildInstallments(accounts, schedules, payments, today);
  return accounts.map((account) =>
    summarizeAccount(account, installments, payments, today),
  );
}

export function monthlySummary(
  month: string,
  accounts: DebtAccount[],
  payments: DebtPayment[],
  schedules: DebtSchedule[],
  today = todayISO(),
): MonthSummary {
  const accountIds = new Set(accounts.map((account) => account.id));
  const scopedPayments = activePayments(payments).filter((payment) =>
    accountIds.has(payment.debt_account_id),
  );
  const installments = buildInstallments(accounts, schedules, payments, today);
  const monthInstallments = installments.filter(
    (item) => monthKey(item.schedule.due_date) === month,
  );
  const counts: MonthCounts = {
    paid: 0,
    partially_paid: 0,
    unpaid: 0,
    overdue: 0,
    upcoming: 0,
  };
  for (const item of monthInstallments) {
    if (item.status !== "cancelled") counts[item.status] += 1;
  }

  return {
    month,
    scheduled: monthInstallments
      .filter((item) => item.status !== "cancelled")
      .reduce((sum, item) => sum + Number(item.schedule.amount_due), 0),
    paid: scopedPayments
      .filter((payment) => monthKey(payment.payment_date) === month)
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
    remaining: monthInstallments
      .filter((item) => item.status !== "cancelled")
      .reduce((sum, item) => sum + item.remaining, 0),
    overdueAmount: installments
      .filter((item) => item.status === "overdue")
      .reduce((sum, item) => sum + item.remaining, 0),
    counts,
    installments: monthInstallments,
    payments: scopedPayments.filter(
      (payment) => monthKey(payment.payment_date) === month,
    ),
  };
}

export function calculateDebtTotals(
  accounts: DebtAccount[],
  payments: DebtPayment[],
  schedules: DebtSchedule[],
  today = todayISO(),
): DebtTotals {
  const openAccounts = accounts.filter((account) => account.status !== "closed");
  const openIds = new Set(openAccounts.map((account) => account.id));
  const summaries = buildAccountSummaries(
    openAccounts,
    payments,
    schedules,
    today,
  );
  const totalPaid = summaries.reduce((sum, account) => sum + account.paid, 0);
  const remaining = summaries.reduce(
    (sum, account) => sum + account.remaining,
    0,
  );
  const overdueAccounts = summaries.filter(
    (account) =>
      account.status === "active" &&
      Boolean(account.due_date) &&
      String(account.due_date) < today &&
      account.remaining > 0,
  );
  const dueSoonAccounts = summaries.filter((account) => {
    if (account.remaining <= 0 || !account.due_date) return false;
    const days = daysUntil(account.due_date, today);
    return days >= 0 && days <= 7;
  });
  const month = monthKey(today);
  const monthAccounts = summaries.filter(
    (account) =>
      account.remaining > 0 &&
      Boolean(account.due_date) &&
      monthKey(String(account.due_date)) === month,
  );

  return {
    originalTotal: summaries.reduce((sum, account) => sum + account.original, 0),
    totalPaid,
    remaining,
    progress: percentOf(totalPaid, totalPaid + remaining),
    overdueCount: overdueAccounts.length,
    overdueAmount: overdueAccounts.reduce(
      (sum, account) =>
        sum + (account.nextInstallment?.remaining ?? account.remaining),
      0,
    ),
    overdueAccounts,
    dueSoonCount: dueSoonAccounts.length,
    dueSoonInstallments: dueSoonAccounts
      .map((account) => account.nextInstallment)
      .filter((item): item is Installment => item !== null),
    monthlyTarget: monthAccounts.reduce((sum, account) => {
      // Use this month's installment, never the whole remaining balance.
      const bill = account.nextInstallment?.remaining ?? account.remaining;
      return sum + Math.min(bill, account.remaining);
    }, 0),
    monthlyPaid: activePayments(payments)
      .filter(
        (payment) =>
          openIds.has(payment.debt_account_id) &&
          monthKey(payment.payment_date) === month,
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
    monthlyLabelKey: month,
  };
}

export function nextSevenDays(today = todayISO()): string {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 7));
  return date.toISOString().slice(0, 10);
}

/** Backwards-compatible helpers kept for existing components. */
export type AccountBalance = AccountSummary;

export function accountBalance(
  account: DebtAccount,
  payments: DebtPayment[],
  schedules: DebtSchedule[] = [],
  today = todayISO(),
): AccountSummary {
  return summarizeAccount(
    account,
    buildInstallments([account], schedules, payments, today),
    payments,
    today,
  );
}

export function buildAccountBalances(
  accounts: DebtAccount[],
  payments: DebtPayment[],
  schedules: DebtSchedule[] = [],
  today = todayISO(),
): AccountSummary[] {
  return buildAccountSummaries(accounts, payments, schedules, today);
}
