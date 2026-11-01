import {
  accountBalance,
  activePayments,
  buildAccountBalances,
  calculateDebtTotals,
  nextSevenDays,
} from "../lib/debt/ledger.ts";
import { formatDebtDate, formatRupiah } from "../lib/debt/format.ts";

let pass = 0;
let fail = 0;

function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else {
    fail += 1;
    console.log("   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
  }
}

const owner = "owner-1";
const accounts = [
  {
    id: "a",
    owner_user_id: owner,
    total_amount_due: 100_000,
    original_principal: 90_000,
    interest_fees: 10_000,
    status: "active",
    due_date: "2026-01-01",
  },
  {
    id: "b",
    owner_user_id: owner,
    total_amount_due: 50_000,
    original_principal: 50_000,
    interest_fees: 0,
    status: "active",
    due_date: "2026-01-20",
  },
  {
    id: "c",
    owner_user_id: owner,
    total_amount_due: 20_000,
    original_principal: 20_000,
    interest_fees: 0,
    status: "closed",
    due_date: null,
  },
];

const payments = [
  {
    id: "p1",
    debt_account_id: "a",
    amount: 40_000,
    payment_date: "2026-01-05",
    reversed_at: null,
  },
  {
    id: "p2",
    debt_account_id: "a",
    amount: 10_000,
    payment_date: "2026-01-06",
    reversed_at: "2026-01-07T00:00:00Z",
  },
  {
    id: "p3",
    debt_account_id: "b",
    amount: 50_000,
    payment_date: "2025-12-31",
    reversed_at: null,
  },
];

const schedules = [
  {
    id: "s1",
    debt_account_id: "a",
    due_date: "2026-01-12",
    amount_due: 25_000,
    status: "upcoming",
  },
  {
    id: "s2",
    debt_account_id: "a",
    due_date: "2026-01-28",
    amount_due: 15_000,
    status: "upcoming",
  },
  {
    id: "s3",
    debt_account_id: "a",
    due_date: "2026-01-15",
    amount_due: 5_000,
    status: "paid",
  },
];

t("active payments exclude reversed", activePayments(payments).length, 2);
t("account A paid total", accountBalance(accounts[0], payments).paid, 40_000);
t("account A remaining", accountBalance(accounts[0], payments).remaining, 60_000);
t("account A progress", accountBalance(accounts[0], payments).progress, 40);
t("account B fully paid", accountBalance(accounts[1], payments).remaining, 0);
t("account B progress", accountBalance(accounts[1], payments).progress, 100);

const balances = buildAccountBalances(accounts, payments);
t("closed account remains represented", balances.length, 3);

const target = calculateDebtTotals(accounts, payments, schedules, "2026-01-10");
t("original total excludes closed", target.originalTotal, 150_000);
t("total paid excludes closed account", target.totalPaid, 90_000);
t("remaining is never negative", target.remaining, 60_000);
t("overall progress", target.progress, 60);
t("overdue account count", target.overdueCount, 1);
t("due within seven days", target.dueSoonCount, 1);
t("monthly target from upcoming schedules", target.monthlyTarget, 40_000);
t("monthly paid from active payments", target.monthlyPaid, 40_000);
t("seven day boundary", nextSevenDays("2026-01-10"), "2026-01-17");
t("IDR has no unnecessary decimals", formatRupiah(1_234_567), "Rp 1.234.567");
t("date format is Indonesia-friendly", formatDebtDate("2026-01-01"), "1 Jan 2026");

const overpaid = accountBalance(accounts[0], [
  ...payments,
  { id: "p4", debt_account_id: "a", amount: 150_000, reversed_at: null },
]);
t("overpayment never displays negative", overpaid.remaining, 0);
t("overpayment caps progress", overpaid.progress, 100);

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
