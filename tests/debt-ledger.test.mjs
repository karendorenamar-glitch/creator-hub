import {
  activePayments,
  buildAccountSummaries,
  buildInstallments,
  calculateDebtTotals,
  deriveInstallmentStatus,
  monthlySummary,
  nextSevenDays,
  paidByScheduleId,
} from "../lib/debt/ledger.ts";

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

const today = "2026-11-10";

function account(overrides) {
  return {
    id: "a",
    owner_user_id: "owner-1",
    creditor_name: "Shopee PayLater",
    account_type: "installment",
    reference_label: null,
    original_principal: 0,
    interest_fees: 0,
    total_amount_due: 0,
    opening_date: "2026-01-03",
    due_date: null,
    due_day: null,
    installment_month: 0,
    installment_total_months: 0,
    installment_amount: 0,
    status: "active",
    notes: null,
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
    ...overrides,
  };
}

function schedule(overrides) {
  return {
    id: "s",
    owner_user_id: "owner-1",
    debt_account_id: "a",
    due_date: "2026-11-03",
    amount_due: 300_000,
    status: "upcoming",
    notes: null,
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
    ...overrides,
  };
}

function payment(overrides) {
  return {
    id: "p",
    owner_user_id: "owner-1",
    debt_account_id: "a",
    schedule_id: null,
    amount: 0,
    payment_date: "2026-11-05",
    payment_method: null,
    reference: null,
    notes: null,
    idempotency_key: null,
    reversed_at: null,
    reversal_reason: null,
    created_at: "2026-11-05T00:00:00Z",
    ...overrides,
  };
}

const accounts = [
  account({ id: "a", total_amount_due: 1_200_000, original_principal: 1_200_000 }),
  account({
    id: "b",
    creditor_name: "Bank Mandiri",
    total_amount_due: 800_000,
    original_principal: 800_000,
  }),
  account({ id: "c", status: "closed", total_amount_due: 500_000 }),
];

const schedules = [
  schedule({ id: "s1", due_date: "2026-11-03" }),
  schedule({ id: "s2", due_date: "2026-12-03" }),
  schedule({ id: "s3", due_date: "2026-10-03" }),
  schedule({
    id: "s4",
    debt_account_id: "b",
    due_date: "2026-11-15",
    amount_due: 400_000,
  }),
  schedule({ id: "s5", due_date: "2026-11-20", status: "cancelled" }),
];

const payments = [
  payment({ id: "p1", schedule_id: "s1", amount: 300_000 }),
  payment({ id: "p2", schedule_id: "s3", amount: 100_000 }),
  payment({
    id: "p3",
    debt_account_id: "b",
    schedule_id: "s4",
    amount: 150_000,
    payment_date: "2026-11-08",
  }),
];

const installments = buildInstallments(accounts, schedules, payments, today);
const byId = new Map(installments.map((item) => [item.schedule.id, item]));

// --- Installment statuses -------------------------------------------------
t("paid installment status", byId.get("s1").status, "paid");
t("paid installment remaining", byId.get("s1").remaining, 0);
t("future installment status", byId.get("s2").status, "upcoming");
t("overdue partial status", byId.get("s3").status, "overdue");
t("overdue partial remaining", byId.get("s3").remaining, 200_000);
t("future partial status", byId.get("s4").status, "partially_paid");
t("cancelled status", byId.get("s5").status, "cancelled");

// --- Pure status derivation ----------------------------------------------
t(
  "unpaid status for due month",
  deriveInstallmentStatus(schedule({ due_date: "2026-11-28" }), 0, today),
  "unpaid",
);
t(
  "no payment means no paid status",
  deriveInstallmentStatus(schedule({ due_date: "2026-11-01" }), 0, today),
  "overdue",
);
t(
  "overpayment clamps to paid",
  deriveInstallmentStatus(schedule({ amount_due: 100_000 }), 150_000, today),
  "paid",
);

// --- Payment helpers ------------------------------------------------------
t("active payments exclude reversed", activePayments([
  payment({ id: "x", amount: 10_000 }),
  payment({ id: "y", amount: 5_000, reversed_at: "2026-11-09T00:00:00Z" }),
]).length, 1);
t(
  "paid per installment",
  paidByScheduleId(payments).get("s3"),
  100_000,
);

// --- Account summaries ----------------------------------------------------
const summaries = buildAccountSummaries(accounts, payments, schedules, today);
const summaryA = summaries.find((item) => item.id === "a");
const summaryB = summaries.find((item) => item.id === "b");
const summaryC = summaries.find((item) => item.id === "c");

t("account A original", summaryA.original, 1_200_000);
t("account A paid", summaryA.paid, 400_000);
t("account A remaining", summaryA.remaining, 500_000);
t("account A progress", summaryA.progress, 44);
t("account A installment count", summaryA.installmentCount, 3);
t("account A paid installments", summaryA.paidInstallments, 1);
t("account A open installments", summaryA.openInstallments, 2);
t("account A overdue installments", summaryA.overdueInstallments, 1);
t("account A mismatch flagged", summaryA.mismatch, true);
t("account B remaining", summaryB.remaining, 250_000);
t("closed account keeps its own remaining", summaryC.remaining, 0);

// --- Monthly view ---------------------------------------------------------
const november = monthlySummary("2026-11", accounts, payments, schedules, today);
t("november scheduled", november.scheduled, 700_000);
t("november paid", november.paid, 550_000);
t("november remaining", november.remaining, 250_000);
t("november paid count", november.counts.paid, 1);
t("november partially paid count", november.counts.partially_paid, 1);
t("november overdue count", november.counts.overdue, 0);
t("november upcoming count", november.counts.upcoming, 0);
t("november excludes october and december installments", november.installments.length, 3);
t("november overdue amount", november.overdueAmount, 200_000);

const october = monthlySummary("2026-10", accounts, payments, schedules, today);
t("october scheduled", october.scheduled, 300_000);
t("october paid in october", october.paid, 0);
t("october remaining", october.remaining, 200_000);
t("october overdue count", october.counts.overdue, 1);
t("october paid installment is still tracked", october.installments.length, 1);

const december = monthlySummary("2026-12", accounts, payments, schedules, today);
t("december scheduled", december.scheduled, 300_000);
t("december paid", december.paid, 0);
t("december remaining carries its own installment", december.remaining, 300_000);
t("december installment is upcoming", december.installments[0].status, "upcoming");
t("december only has its own installment", december.installments.length, 1);

// Payments dated in December are reported in December, not November.
const decemberPayments = monthlySummary(
  "2026-12",
  accounts,
  [...payments, payment({ id: "p4", schedule_id: "s2", amount: 300_000, payment_date: "2026-12-02" })],
  schedules,
  today,
);
t("december paid after december payment", decemberPayments.paid, 300_000);
t("december remaining after payment", decemberPayments.remaining, 0);
t(
  "november does not include december payment",
  monthlySummary(
    "2026-11",
    accounts,
    [...payments, payment({ id: "p4", schedule_id: "s2", amount: 300_000, payment_date: "2026-12-02" })],
    schedules,
    today,
  ).paid,
  550_000,
);

// --- Dashboard totals -----------------------------------------------------
const totals = calculateDebtTotals(accounts, payments, schedules, today);
t("total original", totals.originalTotal, 2_000_000);
t("total paid", totals.totalPaid, 550_000);
t("total remaining", totals.remaining, 750_000);
t("total progress", totals.progress, 42);
t("overdue count", totals.overdueCount, 1);
t("overdue amount", totals.overdueAmount, 200_000);
t("monthly target", totals.monthlyTarget, 700_000);
t("monthly paid", totals.monthlyPaid, 550_000);
t("due soon count", totals.dueSoonCount, 1);
t("next seven days", nextSevenDays("2026-11-10"), "2026-11-17");

// --- No negative balances -------------------------------------------------
const overpaid = buildInstallments(
  [account({ id: "z", total_amount_due: 100_000 })],
  [schedule({ id: "sz", debt_account_id: "z", amount_due: 100_000 })],
  [payment({ id: "pz", debt_account_id: "z", schedule_id: "sz", amount: 150_000 })],
  today,
)[0];
t("overpaid remaining is zero", overpaid.remaining, 0);
t("overpaid is paid", overpaid.status, "paid");

// --- Paid months entered at creation (e.g. 5/12) ---------------------------
const started = account({
  id: "started",
  total_amount_due: 2_400_000,
  original_principal: 2_400_000,
  installment_amount: 200_000,
  installment_total_months: 12,
  installment_month: 5,
});
const startedSchedules = Array.from({ length: 7 }, (_, index) =>
  schedule({
    id: `st${index}`,
    debt_account_id: "started",
    due_date: `2027-0${index + 1}-03`,
    amount_due: 200_000,
  }),
);
const startedSummary = buildAccountSummaries(
  [started],
  [],
  startedSchedules,
  today,
)[0];
t("5/12 paid from contract", startedSummary.paid, 1_000_000);
t("5/12 remaining is 7 rows", startedSummary.remaining, 1_400_000);
t("5/12 progress", startedSummary.progress, 42);
t("5/12 original", startedSummary.original, 2_400_000);

// Custom 5/12 without a known contract only tracks the remaining rows.
const customStarted = account({
  id: "customStarted",
  total_amount_due: 1_400_000,
  installment_amount: 0,
  installment_total_months: 12,
  installment_month: 5,
});
const customSummary = buildAccountSummaries(
  [customStarted],
  [],
  startedSchedules.map((item) => ({ ...item, debt_account_id: "customStarted" })),
  today,
)[0];
t("custom 5/12 paid stays zero", customSummary.paid, 0);
t("custom 5/12 remaining is tracked", customSummary.remaining, 1_400_000);

// --- Legacy tenor fallback ------------------------------------------------
const legacyAccount = account({
  id: "legacy",
  total_amount_due: 2_400_000,
  original_principal: 2_400_000,
  installment_amount: 200_000,
  installment_total_months: 12,
  installment_month: 10,
  due_date: "2026-12-03",
  due_day: 3,
});
const legacySummaries = buildAccountSummaries(
  [legacyAccount],
  [],
  [],
  today,
);
const legacy = legacySummaries[0];
t("legacy original", legacy.original, 2_400_000);
t("legacy paid", legacy.paid, 2_000_000);
t("legacy remaining", legacy.remaining, 400_000);
t("legacy progress", legacy.progress, 83);
t("legacy flagged", legacy.legacy, true);
t("legacy open installments", legacy.openInstallments, 2);
t("legacy next installment amount", legacy.nextInstallment.remaining, 200_000);
t("legacy next installment has no real id", legacy.nextInstallment.schedule.id, "");

const legacyTotals = calculateDebtTotals([legacyAccount], [], [], today);
t("legacy total remaining", legacyTotals.remaining, 400_000);
t("legacy total paid", legacyTotals.totalPaid, 2_000_000);

// --- Single amount fallback -----------------------------------------------
const single = buildAccountSummaries(
  [account({ id: "single", total_amount_due: 500_000 })],
  [payment({ id: "ps", debt_account_id: "single", amount: 200_000 })],
  [],
  today,
)[0];
t("single original", single.original, 500_000);
t("single paid", single.paid, 200_000);
t("single remaining", single.remaining, 300_000);
t("single flagged legacy", single.legacy, true);
t("single next remaining", single.nextInstallment.remaining, 300_000);
t("single next has no real id", single.nextInstallment.schedule.id, "");

console.log(`\n${pass} passed, ${fail} failed`);

if (fail > 0) process.exit(1);
