"use server";

import { revalidatePath } from "next/cache";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadAffiliate } from "@/lib/affiliate/session";
import { text } from "@/lib/wedding/validation";

export type ProfileState = { error?: string; ok?: boolean } | null;

/** Only the profile columns granted to affiliates can be changed here. */
export async function updateAffiliateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createWeddingClient();
  const affiliate = await loadAffiliate(supabase);
  if (!affiliate) return { error: "Please sign in again." };

  const fullName = text(formData, "fullName").trim().slice(0, 120);
  if (fullName.length < 2) return { error: "Please enter your name." };

  const { error } = await supabase
    .from("affiliates")
    .update({
      full_name: fullName,
      instagram_username: text(formData, "instagram").trim().slice(0, 60) || null,
      tiktok_username: text(formData, "tiktok").trim().slice(0, 60) || null,
      bank_name: text(formData, "bankName").trim().slice(0, 80) || null,
      account_holder_name: text(formData, "accountHolder").trim().slice(0, 120) || null,
      bank_account_number: text(formData, "accountNumber").trim().slice(0, 40) || null,
    })
    .eq("user_id", affiliate.user_id ?? "");

  if (error) {
    console.error("[updateAffiliateProfileAction]", error.code, error.message);
    return { error: `Could not save the profile (${error.message}).` };
  }

  revalidatePath("/affiliate/profile");
  revalidatePath("/affiliate/dashboard");
  return { ok: true };
}
