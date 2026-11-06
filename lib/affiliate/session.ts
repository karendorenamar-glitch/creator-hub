import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeddingDatabase } from "@/lib/wedding/db-types";

export type AffiliateRow = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  referral_code: string;
  status: "active" | "suspended";
  instagram_username: string | null;
  tiktok_username: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  bank_account_number: string | null;
};

/** Returns the affiliate row of the signed-in user, or null. */
export async function loadAffiliate(
  supabase: SupabaseClient<WeddingDatabase>,
): Promise<AffiliateRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from("affiliates")
    .select(
      "id, user_id, email, full_name, referral_code, status, instagram_username, tiktok_username, bank_name, account_holder_name, bank_account_number",
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return (data as AffiliateRow | null) ?? null;
}
