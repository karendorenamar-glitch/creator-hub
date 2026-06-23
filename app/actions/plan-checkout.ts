"use server";

import { getOrgIdForAction } from "@/lib/org";
import { isCheckoutPlan, type CheckoutPlan } from "@/lib/plan-checkout";
import { createClient } from "@/lib/supabase/server";

export async function logCheckoutPlanView(plan: CheckoutPlan) {
  if (!isCheckoutPlan(plan)) {
    return { error: "Invalid checkout plan." };
  }

  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("plan_checkout_views").insert({
    org_id: orgResult.orgId,
    plan,
  });

  if (error) {
    if (error.message.toLowerCase().includes("plan_checkout_views")) {
      return { ok: true as const };
    }

    return { error: error.message };
  }

  return { ok: true as const };
}
