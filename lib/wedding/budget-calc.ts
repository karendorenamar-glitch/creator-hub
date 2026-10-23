/**
 * Financial rules for the wedding budget dashboard.
 *
 * Kept in a pure module (no Supabase imports) so the numbers can be
 * verified with unit tests independently from the database.
 *
 * Rules:
 *  0. A category enters the budget only after the couple committed to a
 *     vendor, i.e. the selected option has at least one real payment.
 *     Categories still "diskusi" contribute nothing.
 *  1. Committed cost = agreed_price (fallback quoted_price) of the SELECTED
 *     option only. Alternates are never counted.
 *  2. Paid = sum of real payment rows for the selected option. A status
 *     label never creates a payment.
 *  3. Outstanding bill = committed cost - paid. It may be negative.
 *  4. Paid percentage = paid / committed cost, and only when there is a real
 *     cost AND a real payment. Never 100% without a payment.
 *  5. Remaining budget = target budget - committed cost.
 */

export type BudgetVendor = {
  id: string;
  agreed_price: number | null;
  quoted_price: number | null;
};

export type BudgetPayment = {
  vendor_id: string;
  amount: number;
};

export type BudgetGroup = {
  id: string;
  selected_vendor_id: string | null;
  status: string;
};

export type BudgetResult = {
  committedCost: number;
  committedPaid: number;
  outstandingBill: number;
  remainingBudget: number;
  remaining: number;
  paidPercent: number;
  overpaid: boolean;
  overBudget: boolean;
  unknownPriceGroups: number;
  statusTotals: Record<string, number>;
  statusVendors: Record<string, number>;
  paidByVendor: Map<string, number>;
};

export function paidTotalsByVendor(payments: BudgetPayment[]) {
  const map = new Map<string, number>();
  for (const payment of payments) {
    map.set(
      payment.vendor_id,
      (map.get(payment.vendor_id) ?? 0) + Number(payment.amount),
    );
  }
  return map;
}

export function vendorPrice(vendor: BudgetVendor | undefined) {
  if (!vendor) return null;
  const agreed = vendor.agreed_price;
  if (agreed !== null && agreed !== undefined) return Number(agreed);
  const quoted = vendor.quoted_price;
  if (quoted !== null && quoted !== undefined) return Number(quoted);
  return null;
}

export function calculateBudget(input: {
  groups: BudgetGroup[];
  vendors: BudgetVendor[];
  payments: BudgetPayment[];
  target: number;
}): BudgetResult {
  const paidByVendor = paidTotalsByVendor(input.payments);
  const vendorById = new Map(input.vendors.map((v) => [v.id, v]));

  let committedCost = 0;
  let committedPaid = 0;
  let unknownPriceGroups = 0;

  const statusTotals: Record<string, number> = { diskusi: 0, dp: 0, lunas: 0 };
  const statusVendors: Record<string, number> = { diskusi: 0, dp: 0, lunas: 0 };

  for (const group of input.groups) {
    const selected = group.selected_vendor_id
      ? vendorById.get(group.selected_vendor_id)
      : undefined;
    if (!selected) continue;

    // Rule 2 - real payments only.
    const paid = paidByVendor.get(selected.id) ?? 0;

    // A category only enters the budget once the couple has actually committed
    // to a vendor, i.e. there is a real payment (DP or Lunas). Categories that
    // are still "diskusi" contribute nothing to the budget.
    if (paid <= 0) {
      statusVendors[group.status] = (statusVendors[group.status] ?? 0) + 1;
      continue;
    }

    // Rule 1
    const price = vendorPrice(selected);
    if (price === null) {
      unknownPriceGroups += 1;
    } else {
      committedCost += price;
    }

    committedPaid += paid;

    // Rule 6 - the vendor price is bucketed by its real status.
    const value = price ?? 0;
    statusTotals[group.status] = (statusTotals[group.status] ?? 0) + value;
    statusVendors[group.status] = (statusVendors[group.status] ?? 0) + 1;
  }

  // Rule 3
  const outstandingBill = committedCost - committedPaid;
  const overpaid = outstandingBill < 0;

  // Rule 4
  const paidPercent =
    committedCost > 0 && committedPaid > 0
      ? Math.round((committedPaid / committedCost) * 100)
      : 0;

  // Rule 5
  const remainingBudget = input.target - committedCost;
  const overBudget = input.target > 0 && committedCost > input.target;

  return {
    committedCost,
    committedPaid,
    outstandingBill,
    remainingBudget,
    remaining: remainingBudget,
    paidPercent,
    overpaid,
    overBudget,
    unknownPriceGroups,
    statusTotals,
    statusVendors,
    paidByVendor,
  };
}
