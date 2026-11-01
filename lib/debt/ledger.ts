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

export function summarizeAccount(
  account: DebtAccount,
  installments: Installment[],
  payments: DebtPayment[],
): AccountSummary {
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
  const paid = activePayments(payments)
    .filter((payment) => payment.debt_account_id === account.id)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const contract = Number(account.total_amount_due);
  // Without a contract total the schedule itself defines the original debt.
  const original = contract > 0 ? contract : scheduled;
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
    mismatch: contract > 0 && scheduled > 0 && contract !== scheduled,
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
    summarizeAccount(account, installments, payments),
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
  const installments = buildInstallments(
    openAccounts,
    schedules,
    payments,
    today,
  ).filter((item) => item.status !== "cancelled");
  const overdue = installments.filter((item) => item.status === "overdue");
  const dueSoon = installments.filter((item) => {
    if (item.remaining <= 0) return false;
    const days = daysUntil(item.schedule.due_date, today);
    return days >= 0 && days <= 7;
  });
  const month = monthKey(today);
  const totalPaid = summaries.reduce((sum, account) => sum + account.paid, 0);
  const remaining = summaries.reduce(
    (sum, account) => sum + account.remaining,
    0,
  );

  return {
    originalTotal: summaries.reduce((sum, account) => sum + account.original, 0),
    totalPaid,
    remaining,
    progress: percentOf(totalPaid, totalPaid + remaining),
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, item) => sum + item.remaining, 0),
    overdueAccounts: summaries.filter(
      (account) => account.overdueInstallments > 0,
    ),
    dueSoonCount: dueSoon.length,
    dueSoonInstallments: dueSoon,
    monthlyTarget: installments
      .filter((item) => monthKey(item.schedule.due_date) === month)
      .reduce((sum, item) => sum + Number(item.schedule.amount_due), 0),
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
