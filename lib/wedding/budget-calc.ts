/**
 * Authoritative wedding budget and payment-status rules.
 *
 * Kept free of Supabase/Next imports so the numbers and derived statuses can be
 * unit-tested directly with `node --experimental-strip-types`.
 *
 *  - Active confirmed vendors are non-archived vendors that were explicitly
 *    confirmed (`selection_status = 'terpilih'`) or already have real payment
 *    history (legacy compatibility; no data is rewritten).
 *  - Vendor Budget = sum of agreed prices for active confirmed vendors.
 *    Missing agreed prices contribute 0 and make the budget incomplete.
 *  - Total Paid = sum of real payment rows for active confirmed vendors.
 *  - Lunas requires actual payments to cover a known positive agreed price, or
 *    an explicit completion flag for an agreed_price = 0 collaboration.
 *  - Target Budget compares to Vendor Budget + Budget Lainnya, never to Total Paid.
 */

export type BudgetPaymentKind = "dp" | "lanjutan" | "pelunasan";

export type DerivedPaymentStatus =
  | "diskusi"
  | "dp"
  | "termin_lanjutan"
  | "lunas"
  | "donor"
  | "incomplete";

export type TargetBudgetStatus =
  | "under"
  | "on"
  | "over"
  | "unset"
  | "provisional";

export type BudgetVendor = {
  id: string;
  name?: string | null;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  notes?: string | null;
  agreed_price: number | null;
  archived_at: string | null;
  collaboration_completed_at?: string | null;
  funded_by_donor?: boolean;
  /** Legacy compatibility flag; never shown as a workflow in the new UI. */
  selection_status?: "alternatif" | "terpilih";
};

export type BudgetPayment = {
  id?: string;
  vendor_id: string;
  amount: number;
  payment_kind?: BudgetPaymentKind;
};

export type BudgetOtherCost = {
  id?: string;
  name: string;
  amount: number;
  paidAmount: number;
  fundedByDonor?: boolean;
};

export type BudgetDonation = {
  amount: number;
};

export type VendorPaymentSummary = {
  paymentCount: number;
  /** Cash actually paid to the vendor. */
  cashPaid: number;
  /** Full agreed price covered by the donation pool. */
  donorFunded: number;
  /** Cash + donor-funded amount. */
  totalPaid: number;
  remainingPayment: number;
  overpayment: number;
  paymentStatus: DerivedPaymentStatus;
};

export type BudgetResult = {
  vendorBudget: number;
  otherCostsTotal: number;
  otherCostsPaid: number;
  cashPaid: number;
  donorCovered: number;
  donationsTotal: number;
  donationAvailable: number;
  donationExcess: number;
  donationShortfall: number;
  /** Cash paid + donor-funded costs. */
  totalPaid: number;
  /** Costs not covered by cash or an allocated donor-funded cost. */
  sisaTagihan: number;
  /** Kept as an alias for existing callers; unallocated donations are not deducted. */
  sisaPerluDisiapkan: number;
  remainingPayment: number;
  overpayment: number;
  paymentPercentage: number;

  targetBudget: number;
  targetStatus: TargetBudgetStatus;
  /** Positive for "under", 0 for "on", absolute for "over", null for unset. */
  targetDifference: number | null;

  vendorBudgetComplete: boolean;
  missingAgreedPriceCount: number;

  activeVendors: BudgetVendor[];
  archivedVendors: BudgetVendor[];
  archivedPaid: number;
  otherCosts: BudgetOtherCost[];

  paidByVendor: Map<string, number>;
  remainingByVendor: Map<string, number>;
  overpaymentByVendor: Map<string, number>;
  statusByVendor: Map<string, DerivedPaymentStatus>;
  summaryByVendor: Map<string, VendorPaymentSummary>;
};

export function isActiveConfirmedVendor(
  vendor: BudgetVendor,
  hasPayments: boolean,
): boolean {
  return (
    !vendor.archived_at &&
    (vendor.selection_status === "terpilih" || hasPayments)
  );
}

function amountOf(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function priceOf(vendor: BudgetVendor): number | null {
  if (vendor.agreed_price === null || vendor.agreed_price === undefined) {
    return null;
  }
  const price = Number(vendor.agreed_price);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

/**
 * Derived status from actual transactions and the agreed price.
 *
 * Precedence:
 *  1. Missing agreed price -> incomplete (never Lunas).
 *  2. No payment rows -> Diskusi, except an explicitly completed zero-price
 *     endorsement/sponsorship/barter collaboration -> Lunas.
 *  3. Actual payments cover a known price -> Lunas (overpayment separate).
 *  4. A continuation/final transaction exists -> Termin Lanjutan.
 *  5. Otherwise -> DP.
 */
export function derivePaymentStatus(
  agreedPrice: number | null,
  payments: Array<Pick<BudgetPayment, "amount" | "payment_kind">>,
  collaborationCompletedAt: string | null = null,
  fundedByDonor = false,
): DerivedPaymentStatus {
  if (agreedPrice === null || agreedPrice === undefined) {
    return "incomplete";
  }

  const price = Number(agreedPrice);
  if (!Number.isFinite(price) || price < 0) return "incomplete";
  if (fundedByDonor) return "donor";

  const positivePayments = payments.filter((p) => amountOf(p.amount) > 0);
  if (positivePayments.length === 0) {
    // Explicit zero-price endorsement/barter completion is Lunas without cash.
    if (price === 0 && collaborationCompletedAt) return "lunas";
    return "diskusi";
  }

  const totalPaid = positivePayments.reduce(
    (sum, payment) => sum + amountOf(payment.amount),
    0,
  );

  if (totalPaid >= price) return "lunas";

  const hasLaterStage = positivePayments.some(
    (payment) =>
      payment.payment_kind === "lanjutan" ||
      payment.payment_kind === "pelunasan",
  );

  return hasLaterStage ? "termin_lanjutan" : "dp";
}

function targetStatusFor(
  targetBudget: number,
  plannedBudget: number,
  complete: boolean,
): { status: TargetBudgetStatus; difference: number | null } {
  if (!Number.isFinite(targetBudget) || targetBudget <= 0) {
    return { status: "unset", difference: null };
  }

  const difference = targetBudget - plannedBudget;

  if (!complete) {
    // Keep the numeric difference available for display, but do not present a
    // definitive under/on/over status while prices are missing.
    return { status: "provisional", difference };
  }

  if (difference > 0) return { status: "under", difference };
  if (difference === 0) return { status: "on", difference: 0 };
  return { status: "over", difference: Math.abs(difference) };
}

export function calculateBudget(input: {
  vendors: BudgetVendor[];
  payments: BudgetPayment[];
  otherCosts?: BudgetOtherCost[];
  donations?: BudgetDonation[];
  targetBudget?: number | null;
}): BudgetResult {
  // Deduplicate vendors by id so the same vendor cannot be counted twice.
  const vendorById = new Map<string, BudgetVendor>();
  for (const vendor of input.vendors) {
    if (!vendorById.has(vendor.id)) vendorById.set(vendor.id, vendor);
  }

  // Deduplicate payment rows by id when available. Rows without an id are
  // still individual transactions and are counted once each.
  const seenPaymentIds = new Set<string>();
  const uniquePayments: BudgetPayment[] = [];
  for (const payment of input.payments) {
    if (payment.id) {
      if (seenPaymentIds.has(payment.id)) continue;
      seenPaymentIds.add(payment.id);
    }
    uniquePayments.push(payment);
  }

  const paymentsByVendor = new Map<string, BudgetPayment[]>();
  for (const payment of uniquePayments) {
    const bucket = paymentsByVendor.get(payment.vendor_id) ?? [];
    bucket.push(payment);
    paymentsByVendor.set(payment.vendor_id, bucket);
  }

  const paidByVendor = new Map<string, number>();
  const remainingByVendor = new Map<string, number>();
  const overpaymentByVendor = new Map<string, number>();
  const statusByVendor = new Map<string, DerivedPaymentStatus>();
  const summaryByVendor = new Map<string, VendorPaymentSummary>();

  const activeVendors: BudgetVendor[] = [];
  const archivedVendors: BudgetVendor[] = [];

  let vendorBudget = 0;
  let vendorPaid = 0;
  let vendorDonorCovered = 0;
  let missingAgreedPriceCount = 0;
  let archivedPaid = 0;

  for (const vendor of vendorById.values()) {
    const payments = paymentsByVendor.get(vendor.id) ?? [];
    const price = priceOf(vendor);
    const paid = payments.reduce(
      (sum, payment) => sum + amountOf(payment.amount),
      0,
    );
    const donorFunded =
      vendor.funded_by_donor && price !== null
        ? Math.max(0, Math.max(0, price) - paid)
        : 0;
    const covered = paid + donorFunded;
    const remaining = price === null ? 0 : Math.max(0, price - covered);
    const overpayment = price === null ? 0 : Math.max(0, paid - price);
    const status = derivePaymentStatus(
      price,
      payments,
      vendor.collaboration_completed_at ?? null,
      Boolean(vendor.funded_by_donor),
    );

    paidByVendor.set(vendor.id, paid);
    remainingByVendor.set(vendor.id, remaining);
    overpaymentByVendor.set(vendor.id, overpayment);
    statusByVendor.set(vendor.id, status);
    summaryByVendor.set(vendor.id, {
      paymentCount: payments.length,
      cashPaid: paid,
      donorFunded,
      totalPaid: covered,
      remainingPayment: remaining,
      overpayment,
      paymentStatus: status,
    });

    if (vendor.archived_at) {
      archivedVendors.push(vendor);
      archivedPaid += paid;
      continue;
    }

    if (!isActiveConfirmedVendor(vendor, payments.length > 0)) continue;

    activeVendors.push(vendor);
    vendorBudget += price ?? 0;
    vendorPaid += paid;
    vendorDonorCovered += donorFunded;
    if (price === null) missingAgreedPriceCount += 1;
  }

  const otherCosts = input.otherCosts ?? [];
  const otherCostsTotal = otherCosts.reduce(
    (sum, cost) => sum + amountOf(cost.amount),
    0,
  );
  const otherCostsPaid = otherCosts.reduce(
    (sum, cost) =>
      sum + Math.min(amountOf(cost.paidAmount), amountOf(cost.amount)),
    0,
  );
  const otherDonorCovered = otherCosts.reduce(
    (sum, cost) =>
      sum +
      (cost.fundedByDonor
        ? Math.max(0, amountOf(cost.amount))
        : 0),
    0,
  );
  const cashPaid = vendorPaid + otherCostsPaid;
  const donorCovered = vendorDonorCovered + otherDonorCovered;
  const totalPaid = cashPaid + donorCovered;
  const plannedBudget = vendorBudget + otherCostsTotal;
  const donationsTotal = (input.donations ?? []).reduce(
    (sum, donation) => sum + Math.max(0, amountOf(donation.amount)),
    0,
  );
  const donationAvailable = Math.max(0, donationsTotal - donorCovered);
  // Only donor-funded costs are allocated. Donations that are still available
  // are shown as a separate pool and are NOT silently subtracted from the bill.
  const sisaTagihan = Math.max(0, plannedBudget - totalPaid);
  const sisaPerluDisiapkan = sisaTagihan;
  const remainingPayment = sisaTagihan;
  const donationExcess = donationAvailable;
  const donationShortfall = Math.max(0, donorCovered - donationsTotal);
  const overpayment = Math.max(
    0,
    cashPaid - Math.max(0, plannedBudget - donorCovered),
  );
  const paymentPercentage =
    plannedBudget > 0
      ? Math.round((cashPaid / plannedBudget) * 10000) / 100
      : 0;

  const targetBudget = Math.max(0, amountOf(input.targetBudget));
  const vendorBudgetComplete = missingAgreedPriceCount === 0;
  const target = targetStatusFor(
    targetBudget,
    plannedBudget,
    vendorBudgetComplete,
  );

  return {
    vendorBudget,
    otherCostsTotal,
    otherCostsPaid,
    cashPaid,
    donorCovered,
    donationsTotal,
    donationAvailable,
    donationExcess,
    donationShortfall,
    totalPaid,
    sisaTagihan,
    sisaPerluDisiapkan,
    remainingPayment,
    overpayment,
    paymentPercentage,
    targetBudget,
    targetStatus: target.status,
    targetDifference: target.difference,
    vendorBudgetComplete,
    missingAgreedPriceCount,
    activeVendors,
    archivedVendors,
    archivedPaid,
    otherCosts,
    paidByVendor,
    remainingByVendor,
    overpaymentByVendor,
    statusByVendor,
    summaryByVendor,
  };
}
