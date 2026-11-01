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

function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function daysUntil(iso: string, today: string): number {
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${iso}T00:00:00Z`);
  return Math.round((end - start) / DAY_MS);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function percentOf(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

export type AccountBalance = DebtAccount & {
  paid: number;
  remaining: number;
  progress: number;
};

export type DebtTotals = {
  originalTotal: number;
  totalPaid: number;
  remaining: number;
  progress: number;
  overdueCount: number;
  overdueAccounts: AccountBalance[];
  dueSoonCount: number;
  dueSoonSchedules: DebtSchedule[];
  monthlyTarget: number;
  monthlyPaid: number;
  monthlyLabelKey: string;
};

export function activePayments(payments: DebtPayment[]): DebtPayment[] {
  return payments.filter((payment) => !payment.reversed_at);
}

export function accountBalance(
  account: DebtAccount,
  payments: DebtPayment[],
): AccountBalance {
  const recordedPaid = activePayments(payments)
    .filter((payment) => payment.debt_account_id === account.id)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const total = Number(account.total_amount_due);
  const scheduledPaid =
    account.installment_amount > 0 && account.installment_total_months > 0
      ? account.installment_amount *
        Math.min(account.installment_month, account.installment_total_months)
      : 0;
  const paid = Math.min(total, Math.max(recordedPaid, scheduledPaid));
  const remaining = Math.max(0, total - paid);

  return {
    ...account,
    paid,
    remaining,
    progress: percentOf(paid, total),
  };
}

export function buildAccountBalances(
  accounts: DebtAccount[],
  payments: DebtPayment[],
): AccountBalance[] {
  return accounts.map((account) => accountBalance(account, payments));
}

export function calculateDebtTotals(
  accounts: DebtAccount[],
  payments: DebtPayment[],
  schedules: DebtSchedule[],
  today = todayISO(),
): DebtTotals {
  const openAccounts = accounts.filter((account) => account.status !== "closed");
  const openIds = new Set(openAccounts.map((account) => account.id));
  const balances = buildAccountBalances(openAccounts, payments);
  const originalTotal = openAccounts.reduce(
    (sum, account) => sum + Number(account.total_amount_due),
    0,
  );
  const totalPaid = balances.reduce((sum, account) => sum + account.paid, 0);
  const remaining = Math.max(0, originalTotal - totalPaid);

  const openSchedules = schedules.filter((schedule) => {
    if (schedule.status !== "upcoming") return false;
    return openIds.has(schedule.debt_account_id);
  });
  const dueSoon = openSchedules.filter((schedule) => {
    const days = daysUntil(schedule.due_date, today);
    return days >= 0 && days <= 7;
  });
  const month = monthKey(today);

  return {
    originalTotal,
    totalPaid,
    remaining,
    progress: percentOf(totalPaid, originalTotal),
    overdueCount: balances.filter(
      (account) =>
        account.status === "active" &&
        Boolean(account.due_date) &&
        account.remaining > 0 &&
        String(account.due_date) < today,
    ).length,
    overdueAccounts: balances.filter(
      (account) =>
        account.status === "active" &&
        Boolean(account.due_date) &&
        account.remaining > 0 &&
        String(account.due_date) < today,
    ),
    dueSoonCount: dueSoon.length,
    dueSoonSchedules: dueSoon.sort((a, b) =>
      a.due_date.localeCompare(b.due_date),
    ),
    monthlyTarget: openSchedules
      .filter((schedule) => monthKey(schedule.due_date) === month)
      .reduce((sum, schedule) => sum + Number(schedule.amount_due), 0),
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
  return addDaysISO(today, 7);
}
