import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeddingDatabase } from "@/lib/wedding/db-types";

/**
 * Marks one candidate as selected. The old candidate is only unlinked; its
 * vendor and payment history are never deleted. The unique partial index in
 * migration 027 is the final guard for one selected candidate per category.
 */
export async function linkVendorOption(
  supabase: SupabaseClient<WeddingDatabase>,
  weddingId: string,
  optionId: string,
  vendorId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { data: option } = await supabase
    .from("vendor_options")
    .select("id, category")
    .eq("id", optionId)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (!option) return { ok: false };

  await supabase
    .from("vendor_options")
    .update({ selected_vendor_id: null })
    .eq("wedding_id", weddingId)
    .ilike("category", option.category)
    .not("selected_vendor_id", "is", null)
    .neq("id", optionId);

  const { error } = await supabase
    .from("vendor_options")
    .update({ selected_vendor_id: vendorId })
    .eq("id", optionId)
    .eq("wedding_id", weddingId);

  return error ? { ok: false } : { ok: true };
}
