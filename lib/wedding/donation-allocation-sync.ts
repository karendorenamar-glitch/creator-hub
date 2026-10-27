import type { createWeddingClient } from "@/lib/wedding/supabase";

type Supabase = Awaited<ReturnType<typeof createWeddingClient>>;

type CostSource = {
  expenseId?: string | null;
  vendorId?: string | null;
  label: string;
  amount: number | null;
  fundedByDonor: boolean;
};

function sourceFilter(
  supabase: Supabase,
  weddingId: string,
  source: CostSource,
) {
  const query = supabase
    .from("donation_allocations")
    .select("id, donation_id, amount")
    .eq("wedding_id", weddingId);
  return source.expenseId
    ? query.eq("expense_id", source.expenseId)
    : query.eq("vendor_id", source.vendorId ?? "");
}

/**
 * Keep the automatic allocation for a donor-funded cost in sync.
 *
 * - Only runs when there is exactly one donation. With multiple donors the
 *   correct split is a business decision, so the UI asks for Atur Alokasi.
 * - The source-specific unique index makes this idempotent.
 * - Allocations remain earmarks; the budget payment formula does not change.
 */
export async function syncDonorAllocationForCost(
  supabase: Supabase,
  weddingId: string,
  source: CostSource,
): Promise<void> {
  if (!source.expenseId && !source.vendorId) return;

  if (!source.fundedByDonor) {
    let query = supabase
      .from("donation_allocations")
      .delete()
      .eq("wedding_id", weddingId);
    query = source.expenseId
      ? query.eq("expense_id", source.expenseId)
      : query.eq("vendor_id", source.vendorId ?? "");
    await query;
    return;
  }

  if (source.amount === null || source.amount <= 0) return;

  const { data: donations } = await supabase
    .from("wedding_donations")
    .select("id, amount")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true })
    .limit(2);
  if (!donations || donations.length !== 1) return;

  const donation = donations[0];
  const donationAmount = Number(donation.amount);
  if (source.amount > donationAmount) return;

  const { data: existingRows } = await sourceFilter(
    supabase,
    weddingId,
    source,
  );
  const existing = existingRows?.[0] ?? null;

  const { data: allAllocations } = await supabase
    .from("donation_allocations")
    .select("id, amount")
    .eq("donation_id", donation.id)
    .eq("wedding_id", weddingId);
  const allocatedOther = (allAllocations ?? []).reduce(
    (sum, row) =>
      row.id === existing?.id ? sum : sum + Number(row.amount),
    0,
  );
  if (allocatedOther + source.amount > donationAmount) return;

  const values = {
    wedding_id: weddingId,
    donation_id: donation.id,
    expense_id: source.expenseId ?? null,
    vendor_id: source.vendorId ?? null,
    label: source.label,
    amount: source.amount,
  };

  if (existing) {
    await supabase
      .from("donation_allocations")
      .update(values)
      .eq("id", existing.id)
      .eq("wedding_id", weddingId);
  } else {
    await supabase.from("donation_allocations").insert(values);
  }
}
