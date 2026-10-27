"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { isUuid, parseWholeRupiah, text } from "@/lib/wedding/validation";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

function readDonation(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; donorName: string; amount: number } | { ok: false; error: string } {
  const donorName = text(formData, "donorName").slice(0, 120);
  if (!donorName) return { ok: false, error: copy.form.required };

  const amount = parseWholeRupiah(text(formData, "amount"), {
    allowZero: false,
  });
  if (amount === null || amount <= 0) {
    return { ok: false, error: copy.budget.donationInvalid };
  }

  return { ok: true, donorName, amount };
}

export async function createDonationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readDonation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase.from("wedding_donations").insert({
    wedding_id: ctx.session.wedding.id,
    donor_name: parsed.donorName,
    amount: parsed.amount,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/budget");
  return { success: ctx.copy.form.saved };
}

export async function updateDonationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readDonation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { data: allocations } = await ctx.supabase
    .from("donation_allocations")
    .select("amount")
    .eq("donation_id", id)
    .eq("wedding_id", ctx.session.wedding.id);
  const allocated = (allocations ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );
  if (parsed.amount < allocated) {
    return { error: ctx.copy.budget.donationBelowAllocation };
  }

  const { error } = await ctx.supabase
    .from("wedding_donations")
    .update({ donor_name: parsed.donorName, amount: parsed.amount })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/budget");
  return { success: ctx.copy.form.saved };
}

export async function deleteDonationAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("wedding_donations")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/budget");
  return null;
}
