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
 *  - Target Budget compares to Vendor Budget only, never to Total Paid.
 */

export type BudgetPaymentKind = "dp" | "lanjutan" | "pelunasan";

export type DerivedPaymentStatus =
  | "diskusi"
  | "dp"
  | "termin_lanjutan"
  | "lunas"
  | "incomplete";

export type TargetBudgetStatus =
  | "under"
  | "on"
  | "over"
  | "unset"
  | "provisional";

export type CollaborationType =
  | "paid"
  | "endorsement"
  | "sponsorship"
  | "barter";

export type BudgetVendor = {
  id: string;
  name?: string | null;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  notes?: string | null;
  agreed_price: number | null;
  archived_at: string | null;
  collaboration_type?: CollaborationType;
  collaboration_completed_at?: string | null;
  /** Legacy compatibility flag; never shown as a workflow in the new UI. */
  selection_status?: "alternatif" | "terpilih";
};

export type BudgetPayment = {
  id?: string;
  vendor_id: string;
  amount: number;
  payment_kind?: BudgetPaymentKind;
};

export type VendorPaymentSummary = {
  paymentCount: number;
  totalPaid: number;
  remainingPayment: number;
  overpayment: number;
  paymentStatus: DerivedPaymentStatus;
};

export type BudgetResult = {
  vendorBudget: number;
  totalPaid: number;
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
): DerivedPaymentStatus {
  if (agreedPrice === null || agreedPrice === undefined) {
    return "incomplete";
  }

  const price = Number(agreedPrice);
  if (!Number.isFinite(price) || price < 0) return "incomplete";

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
  vendorBudget: number,
  complete: boolean,
): { status: TargetBudgetStatus; difference: number | null } {
  if (!Number.isFinite(targetBudget) || targetBudget <= 0) {
    return { status: "unset", difference: null };
  }

  const difference = targetBudget - vendorBudget;

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
  let totalPaid = 0;
  let missingAgreedPriceCount = 0;
  let archivedPaid = 0;

  for (const vendor of vendorById.values()) {
    const payments = paymentsByVendor.get(vendor.id) ?? [];
    const price = priceOf(vendor);
    const paid = payments.reduce(
      (sum, payment) => sum + amountOf(payment.amount),
      0,
    );
    const remaining = price === null ? 0 : Math.max(0, price - paid);
    const overpayment = price === null ? 0 : Math.max(0, paid - price);
    const status = derivePaymentStatus(
      price,
      payments,
      vendor.collaboration_completed_at ?? null,
    );

    paidByVendor.set(vendor.id, paid);
    remainingByVendor.set(vendor.id, remaining);
    overpaymentByVendor.set(vendor.id, overpayment);
    statusByVendor.set(vendor.id, status);
    summaryByVendor.set(vendor.id, {
      paymentCount: payments.length,
      totalPaid: paid,
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
    totalPaid += paid;
    if (price === null) missingAgreedPriceCount += 1;
  }

  const remainingPayment = Math.max(0, vendorBudget - totalPaid);
  const overpayment = Math.max(0, totalPaid - vendorBudget);
  const paymentPercentage =
    vendorBudget > 0
      ? Math.round((totalPaid / vendorBudget) * 10000) / 100
      : 0;

  const targetBudget = Math.max(0, amountOf(input.targetBudget));
  const vendorBudgetComplete = missingAgreedPriceCount === 0;
  const target = targetStatusFor(
    targetBudget,
    vendorBudget,
    vendorBudgetComplete,
  );

  return {
    vendorBudget,
    totalPaid,
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
    paidByVendor,
    remainingByVendor,
    overpaymentByVendor,
    statusByVendor,
    summaryByVendor,
  };
}
