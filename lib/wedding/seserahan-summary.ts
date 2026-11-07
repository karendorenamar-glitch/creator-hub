/**
 * Derived seserahan money. Nothing is stored: every number comes from
 * `seserahan_items` (price x quantity), so the budget page can never drift from
 * the seserahan module. Pure and dependency-free for direct testing.
 *
 * Deliberately NOT part of the wedding total cost: seserahan purchases may also
 * be recorded by the customer under vendors or other costs, and counting them
 * twice would inflate spending.
 */

export type SeserahanSummaryRow = {
  party: "groom" | "bride";
  price: number;
  quantity: number;
  status: "purchased" | "not_purchased";
};

export type SeserahanTotals = {
  items: number;
  purchasedItems: number;
  pendingItems: number;
  /** SUM(price x quantity) for every item. */
  plan: number;
  /** SUM(price x quantity) for purchased items. */
  actual: number;
  /** plan - actual, i.e. the value still to buy. */
  remaining: number;
  /** Purchased share of the plan, 0-100. */
  progress: number;
};

function totalsFor(rows: SeserahanSummaryRow[]): SeserahanTotals {
  let plan = 0;
  let actual = 0;
  let purchasedItems = 0;

  for (const row of rows) {
    const line = row.price * row.quantity;
    plan += line;
    if (row.status === "purchased") {
      actual += line;
      purchasedItems += 1;
    }
  }

  return {
    items: rows.length,
    purchasedItems,
    pendingItems: rows.length - purchasedItems,
    plan,
    actual,
    remaining: plan - actual,
    progress: plan > 0 ? Math.round((actual / plan) * 100) : 0,
  };
}

export function summarizeSeserahan(rows: SeserahanSummaryRow[]) {
  return {
    all: totalsFor(rows),
    groom: totalsFor(rows.filter((row) => row.party === "groom")),
    bride: totalsFor(rows.filter((row) => row.party === "bride")),
  };
}
