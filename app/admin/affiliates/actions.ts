"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/wedding/admin";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { text } from "@/lib/wedding/validation";

export async function setAffiliateStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "affiliateId");
  const status = text(formData, "status") === "suspended" ? "suspended" : "active";
  const reason = text(formData, "reason");

  const supabase = await createWeddingClient();
  const { error } = await supabase.rpc("admin_set_affiliate_status", {
    p_affiliate: id,
    p_status: status,
    p_reason: reason || null,
  });
  if (error) console.error("[setAffiliateStatus]", error.message);

  revalidatePath(`/admin/affiliates/${id}`);
  revalidatePath("/admin/affiliates");
}

export async function deleteAffiliate(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "affiliateId");

  const supabase = await createWeddingClient();
  const { error } = await supabase.rpc("admin_delete_affiliate", { p_affiliate: id });
  if (error) {
    console.error("[deleteAffiliate]", error.message);
    revalidatePath(`/admin/affiliates/${id}`);
    return;
  }

  revalidatePath("/admin/affiliates");
  redirect("/admin/affiliates");
}
