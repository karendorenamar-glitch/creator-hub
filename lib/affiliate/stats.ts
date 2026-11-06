import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeddingDatabase } from "@/lib/wedding/db-types";

export type AffiliateStats = {
  clicks: number;
  signups: number;
  approvedPayments: number;
  signupRate: number;
};

/** Counts that the affiliate dashboard shows above the money cards. */
export async function loadAffiliateStats(
  supabase: SupabaseClient<WeddingDatabase>,
  affiliateId: string,
): Promise<AffiliateStats> {
  const [clicks, signups, payments] = await Promise.all([
    supabase
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliateId),
    supabase
      .from("affiliate_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliateId),
    supabase
      .from("affiliate_commissions")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliateId)
      .neq("status", "reversed"),
  ]);

  const totalClicks = clicks.count ?? 0;
  const totalSignups = signups.count ?? 0;

  return {
    clicks: totalClicks,
    signups: totalSignups,
    approvedPayments: payments.count ?? 0,
    signupRate: totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 1000) / 10 : 0,
  };
}
