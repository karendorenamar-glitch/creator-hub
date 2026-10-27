"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { isUuid, optionalText, parseWholeRupiah, text } from "@/lib/wedding/validation";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type AllocationValues = {
  donationId: string;
  categoryId: string | null;
  label: string;
  amount: number;
};

function readAllocation(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: AllocationValues } | { ok: false; error: string } {
  const donationId = text(formData, "donationId");
  const categoryId = optionalText(formData, "categoryId", 80);
  const label = text(formData, "label").slice(0, 120);
  const amount = parseWholeRupiah(text(formData, "amount"), { allowZero: false });
  if (!isUuid(donationId) || (categoryId && !isUuid(categoryId)) || !label) {
    return { ok: false, error: copy.form.required };
  }
  if (amount === null || amount <= 0) {
    return { ok: false, error: copy.budget.allocationInvalid };
  }
  return { ok: true, values: { donationId, categoryId, label, amount } };
}

async function validateAllocation(
  ctx: Awaited<ReturnType<typeof context>>,
  values: AllocationValues,
  ignoreId?: string,
): Promise<string | null> {
  const { data: donation } = await ctx.supabase
    .from("wedding_donations")
    .select("id, amount")
    .eq("id", values.donationId)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();
  if (!donation) return ctx.copy.errors.notFound;

  if (values.categoryId) {
    const { data: category } = await ctx.supabase
      .from("budget_categories")
      .select("id")
      .eq("id", values.categoryId)
      .eq("wedding_id", ctx.session.wedding.id)
      .maybeSingle();
    if (!category) return ctx.copy.errors.notFound;
  }

  const { data: existing } = await ctx.supabase
    .from("donation_allocations")
    .select("id, amount")
    .eq("donation_id", values.donationId)
    .eq("wedding_id", ctx.session.wedding.id);
  const allocated = (existing ?? []).reduce(
    (sum, row) => (row.id === ignoreId ? sum : sum + Number(row.amount)),
    0,
  );
  if (allocated + values.amount > Number(donation.amount)) {
    return ctx.copy.budget.allocationExceeds;
  }
  return null;
}

export async function createDonationAllocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readAllocation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };
  const validation = await validateAllocation(ctx, parsed.values);
  if (validation) return { error: validation };

  const { error } = await ctx.supabase.from("donation_allocations").insert({
    wedding_id: ctx.session.wedding.id,
    donation_id: parsed.values.donationId,
    category_id: parsed.values.categoryId,
    label: parsed.values.label,
    amount: parsed.values.amount,
  });
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/budget");
  return { success: ctx.copy.form.saved };
}

export async function updateDonationAllocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };
  const parsed = readAllocation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };
  const validation = await validateAllocation(ctx, parsed.values, id);
  if (validation) return { error: validation };

  const { error } = await ctx.supabase
    .from("donation_allocations")
    .update({
      donation_id: parsed.values.donationId,
      category_id: parsed.values.categoryId,
      label: parsed.values.label,
      amount: parsed.values.amount,
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/budget");
  return { success: ctx.copy.form.saved };
}

export async function deleteDonationAllocationAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };
  const { error } = await ctx.supabase
    .from("donation_allocations")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/budget");
  return null;
}
