import {
  calculateBudget,
  derivePaymentStatus,
} from "../lib/wedding/budget-calc.ts";
import { moduleCopy } from "../lib/wedding/module-copy.ts";

let pass = 0;
let fail = 0;

function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) {
    pass += 1;
  } else {
    fail += 1;
    console.log("   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
  }
}

function vendor(overrides = {}) {
  return {
    id: "v1",
    name: "Vendor",
    agreed_price: 10_000_000,
    archived_at: null,
    selection_status: "terpilih",
    ...overrides,
  };
}

function payment(overrides = {}) {
  return {
    id: "p1",
    vendor_id: "v1",
    amount: 1_000_000,
    payment_kind: "dp",
    ...overrides,
  };
}

function calc(vendors, payments = [], targetBudget = 0, otherCosts = []) {
  return calculateBudget({ vendors, payments, otherCosts, targetBudget });
}

// 1. Vendor with no payments still contributes its agreed price.
let r = calc([vendor()]);
t("no payment: vendorBudget", r.vendorBudget, 10_000_000);
t("no payment: totalPaid", r.totalPaid, 0);
t("no payment: remaining", r.remainingPayment, 10_000_000);
t("no payment: status", r.statusByVendor.get("v1"), "diskusi");
t("no payment: percentage", r.paymentPercentage, 0);

// 2. Multiple payments sum exactly once.
r = calc(
  [vendor()],
  [
    payment({ id: "p1", amount: 2_000_000, payment_kind: "dp" }),
    payment({ id: "p2", amount: 3_000_000, payment_kind: "lanjutan" }),
  ],
);
t("multiple payments: totalPaid", r.totalPaid, 5_000_000);
t("multiple payments: remaining", r.remainingPayment, 5_000_000);
t("multiple payments: status", r.statusByVendor.get("v1"), "termin_lanjutan");

// 3. Full payment -> Lunas.
r = calc([vendor()], [payment({ amount: 10_000_000 })]);
t("full payment: status", r.statusByVendor.get("v1"), "lunas");
t("full payment: remaining", r.remainingPayment, 0);
t("full payment: overpayment", r.overpayment, 0);

// 4. Overpayment is separate and remaining never negative.
r = calc([vendor()], [payment({ amount: 12_000_000 })]);
t("overpayment: status", r.statusByVendor.get("v1"), "lunas");
t("overpayment: remaining", r.remainingPayment, 0);
t("overpayment: overpayment", r.overpayment, 2_000_000);

// 5. Incomplete Pelunasan must not be Lunas.
r = calc(
  [vendor()],
  [
    payment({ id: "p1", amount: 2_000_000, payment_kind: "dp" }),
    payment({ id: "p2", amount: 3_000_000, payment_kind: "pelunasan" }),
  ],
);
t("incomplete pelunasan: status", r.statusByVendor.get("v1"), "termin_lanjutan");
t("incomplete pelunasan: remaining", r.remainingPayment, 5_000_000);

// 6. DP only, not fully paid.
r = calc([vendor()], [payment({ amount: 2_000_000, payment_kind: "dp" })]);
t("dp only: status", r.statusByVendor.get("v1"), "dp");

// 7. Zero-price vendor with no payment remains Diskusi.
r = calc([vendor({ agreed_price: 0 })]);
t("zero price no payment: status", r.statusByVendor.get("v1"), "diskusi");
t("zero price no payment: vendorBudget", r.vendorBudget, 0);
t("zero price no payment: percentage", r.paymentPercentage, 0);
t("zero price no payment: not lunas", r.statusByVendor.get("v1") !== "lunas", true);

// 8. Zero-price vendor with payment -> Lunas + overpayment.
r = calc([vendor({ agreed_price: 0 })], [payment({ amount: 500_000 })]);
t("zero price paid: status", r.statusByVendor.get("v1"), "lunas");
t("zero price paid: overpayment", r.overpayment, 500_000);

// 8b. Explicit zero-price collaboration completion -> Lunas without cash.
r = calc([vendor({ agreed_price: 0, collaboration_completed_at: "2026-05-01T00:00:00Z" })]);
t("zero completed: status", r.statusByVendor.get("v1"), "lunas");
t("zero completed: totalPaid stays 0", r.totalPaid, 0);
t("zero completed: overpayment stays 0", r.overpayment, 0);
t("zero completed: vendorBudget 0 but complete", r.vendorBudget, 0);
t("zero completed: budget complete", r.vendorBudgetComplete, true);

// 8c. Completion is not cash, even when a cash payment also exists.
r = calc(
  [vendor({ agreed_price: 0, collaboration_completed_at: "2026-05-01T00:00:00Z" })],
  [payment({ amount: 500_000 })],
);
t("zero completed cash: status", r.statusByVendor.get("v1"), "lunas");
t("zero completed cash: totalPaid only cash", r.totalPaid, 500_000);
t("zero completed cash: overpayment", r.overpayment, 500_000);

// 8d. Positive price ignores collaboration completion; payments still decide.
r = calc([vendor({ collaboration_completed_at: "2026-05-01T00:00:00Z" })]);
t("positive completed no cash: status", r.statusByVendor.get("v1"), "diskusi");

// 8e. Changing Rp0 to a positive agreed price recalculates correctly.
r = calc([
  vendor({
    agreed_price: 7_500_000,
    collaboration_completed_at: "2026-05-01T00:00:00Z",
  }),
]);
t("zero-to-positive: status diskusi", r.statusByVendor.get("v1"), "diskusi");
t("zero-to-positive: budget", r.vendorBudget, 7_500_000);

// 8f. Completion on a positive-price vendor must never force Lunas.
r = calc(
  [vendor({ collaboration_completed_at: "2026-05-01T00:00:00Z" })],
  [payment({ amount: 5_000_000, payment_kind: "pelunasan" })],
);
t("positive completed partial: status", r.statusByVendor.get("v1"), "termin_lanjutan");
t("positive completed partial: remaining", r.remainingPayment, 5_000_000);

// 9. Missing agreed price -> incomplete, never Lunas, quoted is ignored.
r = calc(
  [vendor({ agreed_price: null, quoted_price: 99_000_000 })],
  [payment({ amount: 5_000_000 })],
  100_000_000,
);
t("missing price: status", r.statusByVendor.get("v1"), "incomplete");
t("missing price: vendorBudget uses no quote", r.vendorBudget, 0);
t("missing price: incomplete flag", r.vendorBudgetComplete, false);
t("missing price: missing count", r.missingAgreedPriceCount, 1);
t("missing price: target provisional", r.targetStatus, "provisional");
t("missing price: status never lunas", r.statusByVendor.get("v1") !== "lunas", true);

// 10. Archived vendors excluded from active totals, history retained.
r = calc(
  [vendor({ archived_at: "2026-01-01T00:00:00Z" })],
  [payment({ amount: 4_000_000 })],
);
t("archived: vendorBudget", r.vendorBudget, 0);
t("archived: totalPaid", r.totalPaid, 0);
t("archived: archivedPaid", r.archivedPaid, 4_000_000);
t("archived: active count", r.activeVendors.length, 0);
t("archived: archived count", r.archivedVendors.length, 1);

// 11. Legacy alternative without payments is hidden; with payments is active.
r = calc([vendor({ selection_status: "alternatif" })]);
t("legacy alternative no payment: hidden", r.activeVendors.length, 0);
t("legacy alternative no payment: budget", r.vendorBudget, 0);

r = calc(
  [vendor({ selection_status: "alternatif" })],
  [payment({ amount: 1_000_000 })],
);
t("legacy alternative with payment: active", r.activeVendors.length, 1);
t("legacy alternative with payment: budget", r.vendorBudget, 10_000_000);

// 12. Duplicate vendor row and duplicate payment id counted once.
r = calc(
  [vendor(), vendor()],
  [payment({ id: "p1", amount: 2_000_000 }), payment({ id: "p1", amount: 2_000_000 })],
);
t("duplicate vendor: budget", r.vendorBudget, 10_000_000);
t("duplicate payment: totalPaid", r.totalPaid, 2_000_000);

// 13. Target statuses.
r = calc([vendor()], [], 12_000_000);
t("target under", r.targetStatus, "under");
t("target under difference", r.targetDifference, 2_000_000);
t("target under wording ID", moduleCopy.id.budget.targetUnderDetail, "{amount} lebih hemat dari target awal.");
t("target under wording EN", moduleCopy.en.budget.targetUnderDetail, "{amount} less than the original target.");

r = calc([vendor()], [], 10_000_000);
t("target on", r.targetStatus, "on");
t("target on difference", r.targetDifference, 0);

r = calc([vendor()], [], 8_000_000);
t("target over", r.targetStatus, "over");
t("target over difference", r.targetDifference, 2_000_000);

// 13b. Other Budget is part of the Target Budget comparison.
const targetOther = [
  { id: "c1", name: "Transport", amount: 2_000_000, paidAmount: 0 },
];
r = calc([vendor()], [], 12_000_000, targetOther);
t("target includes other budget", r.targetStatus, "on");
t("target includes other budget difference", r.targetDifference, 0);

r = calc([vendor()], [], 11_000_000, targetOther);
t("target other budget over", r.targetStatus, "over");
t("target other budget over difference", r.targetDifference, 1_000_000);

r = calc([vendor()], [], 0);
t("target unset", r.targetStatus, "unset");
t("target unset difference", r.targetDifference, null);

// 14. Editing Target Budget must not change payment metrics.
const baseVendors = [vendor()];
const basePayments = [payment({ amount: 3_000_000 })];
const a = calc(baseVendors, basePayments, 0);
const b = calc(baseVendors, basePayments, 50_000_000);
t("target independence: vendorBudget", b.vendorBudget, a.vendorBudget);
t("target independence: totalPaid", b.totalPaid, a.totalPaid);
t("target independence: remaining", b.remainingPayment, a.remainingPayment);
t("target independence: overpayment", b.overpayment, a.overpayment);
t("target independence: percentage", b.paymentPercentage, a.paymentPercentage);
t("target independence: status changes", a.targetStatus !== b.targetStatus, true);

// 15. Inspiration-like extra property must not affect the result.
const withoutInspiration = calc(baseVendors, basePayments, 50_000_000);
const withExtra = calculateBudget({
  vendors: baseVendors,
  payments: basePayments,
  targetBudget: 50_000_000,
  inspirationReferencePrice: 999_000_000,
});
t("inspiration ignored: vendorBudget", withExtra.vendorBudget, withoutInspiration.vendorBudget);
t("inspiration ignored: totalPaid", withExtra.totalPaid, withoutInspiration.totalPaid);
t("inspiration ignored: target", withExtra.targetStatus, withoutInspiration.targetStatus);

// 16. Other costs: unpaid costs affect the plan but not Total Paid.
const unpaidOther = [
  { id: "c1", name: "Transport", amount: 2_000_000, paidAmount: 0 },
];
r = calc([vendor()], [], 0, unpaidOther);
t("other unpaid: total", r.otherCostsTotal, 2_000_000);
t("other unpaid: paid subtotal", r.otherCostsPaid, 0);
t("other unpaid: totalPaid", r.totalPaid, 0);
t("other unpaid: remaining includes cost", r.remainingPayment, 12_000_000);
t("other unpaid: percentage", r.paymentPercentage, 0);

// 16b. Partial other costs add only the amount actually paid and reduce the remainder.
const partialOther = [
  { id: "c1", name: "Transport", amount: 2_000_000, paidAmount: 500_000 },
];
r = calc([vendor()], [], 0, partialOther);
t("other partial: total", r.otherCostsTotal, 2_000_000);
t("other partial: paid subtotal", r.otherCostsPaid, 500_000);
t("other partial: totalPaid", r.totalPaid, 500_000);
t("other partial: remaining", r.remainingPayment, 11_500_000);
t("other partial: percentage", r.paymentPercentage, 4.17);

// 17. Paid other costs move Total Paid and the automatic percentage.
const paidOther = [
  { id: "c1", name: "Transport", amount: 2_000_000, paidAmount: 2_000_000 },
];
r = calc([vendor()], [], 0, paidOther);
t("other paid: subtotal", r.otherCostsPaid, 2_000_000);
t("other paid: totalPaid", r.totalPaid, 2_000_000);
t("other paid: remaining", r.remainingPayment, 10_000_000);
t("other paid: percentage", r.paymentPercentage, 16.67);

// 17b. Unallocated donations stay in the donation pool; they are not silently
// subtracted from the bill.
const donation = [{ amount: 3_000_000 }];
r = calculateBudget({
  vendors: [vendor()],
  payments: [payment({ amount: 2_000_000 })],
  donations: donation,
  targetBudget: 0,
});
t("donation: totalPaid unchanged", r.totalPaid, 2_000_000);
t("donation: donationsTotal", r.donationsTotal, 3_000_000);
t("donation: remaining unchanged", r.remainingPayment, 8_000_000);
t("donation: available pool", r.donationAvailable, 3_000_000);
t("donation: excess is available", r.donationExcess, 3_000_000);
t("donation: vendor status unchanged", r.statusByVendor.get("v1"), "dp");

r = calculateBudget({
  vendors: [vendor()],
  payments: [payment({ amount: 2_000_000 })],
  donations: [{ amount: 20_000_000 }],
  targetBudget: 0,
});
t("donation excess: remaining unchanged", r.remainingPayment, 8_000_000);
t("donation excess: available amount", r.donationAvailable, 20_000_000);
t("donation excess: amount", r.donationExcess, 20_000_000);
t("donation excess: totalPaid unchanged", r.totalPaid, 2_000_000);

// 18. Vendor payments plus paid other costs can reach 100%.
r = calc([vendor()], [payment({ amount: 10_000_000 })], 0, paidOther);
t("all paid: totalPaid", r.totalPaid, 12_000_000);
t("all paid: remaining", r.remainingPayment, 0);
t("all paid: percentage", r.paymentPercentage, 100);

// 19. Overpayment is measured against vendor + other planned costs.
r = calc([vendor()], [payment({ amount: 11_000_000 })], 0, paidOther);
t("other overpayment: totalPaid", r.totalPaid, 13_000_000);
t("other overpayment: remaining", r.remainingPayment, 0);
t("other overpayment: overpayment", r.overpayment, 1_000_000);

// 19b. Donor-funded vendor is covered without cash and consumes the donation pool.
const donorVendor = vendor({ funded_by_donor: true });
r = calc([donorVendor]);
t("donor vendor: cash paid", r.cashPaid, 0);
t("donor vendor: donor covered", r.donorCovered, 10_000_000);
t("donor vendor: total paid", r.totalPaid, 10_000_000);
t("donor vendor: remaining", r.remainingPayment, 0);
t("donor vendor: status", r.statusByVendor.get("v1"), "donor");
t("donor vendor: shortfall", r.donationShortfall, 10_000_000);

r = calculateBudget({
  vendors: [donorVendor],
  payments: [],
  donations: [{ amount: 10_000_000 }],
  targetBudget: 0,
});
t("donor vendor funded: available donations", r.donationAvailable, 0);
t("donor vendor funded: shortfall", r.donationShortfall, 0);
t("donor vendor funded: remaining", r.remainingPayment, 0);

const donorOther = [
  {
    id: "c1",
    name: "Transport",
    amount: 2_000_000,
    paidAmount: 0,
    fundedByDonor: true,
  },
];
r = calc([vendor()], [], 0, donorOther);
t("donor other: cash subtotal", r.otherCostsPaid, 0);
t("donor other: donor covered", r.donorCovered, 2_000_000);
t("donor other: total paid", r.totalPaid, 2_000_000);
t("donor other: remaining", r.remainingPayment, 10_000_000);

// 19c. Donor status is derived before cash status.
t("derive donor", derivePaymentStatus(10_000_000, [], null, true), "donor");

// 20. Direct derived-status checks.
t("derive no payments", derivePaymentStatus(10_000_000, []), "diskusi");
t("derive zero no payments", derivePaymentStatus(0, []), "diskusi");
t("derive missing price", derivePaymentStatus(null, [payment()]), "incomplete");
t("derive partial dp", derivePaymentStatus(10_000_000, [payment({ amount: 1 })]), "dp");
t("derive partial final", derivePaymentStatus(10_000_000, [
  payment({ amount: 1, payment_kind: "pelunasan" }),
]), "termin_lanjutan");
t("derive fully paid", derivePaymentStatus(10_000_000, [
  payment({ amount: 10_000_000 }),
]), "lunas");
t("derive zero completed", derivePaymentStatus(0, [], "2026-05-01T00:00:00Z"), "lunas");
t("derive zero incomplete", derivePaymentStatus(0, [], null), "diskusi");
t("derive missing price completed", derivePaymentStatus(null, [], "2026-05-01T00:00:00Z"), "incomplete");
t("derive positive completed ignored", derivePaymentStatus(5_000_000, [], "2026-05-01T00:00:00Z"), "diskusi");

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
