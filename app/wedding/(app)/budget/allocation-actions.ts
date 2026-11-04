"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { isUuid, optionalText, parseWholeRupiah, text } from "@/lib/wedding/validation";
import {
  convertInputAmounts,
  recordFinancialEntry,
} from "@/lib/currency/action";
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


function ratesError(locale: "en" | "id") {
  return locale === "en"
    ? "Exchange rates are unavailable right now. Nothing was saved; please try again shortly."
    : "Kurs mata uang sedang tidak tersedia. Belum ada yang disimpan; coba lagi sebentar lagi.";
}

export async function createDonationAllocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readAllocation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const amountConversion = await convertInputAmounts(
    ctx.supabase,
    ctx.session.userId,
    [parsed.values.amount],
  );
  if (!amountConversion) return { error: ratesError(ctx.locale) };
  const values = { ...parsed.values, amount: amountConversion.idr[0] };

  const validation = await validateAllocation(ctx, values);
  if (validation) return { error: validation };

  const { data: created, error } = await ctx.supabase
    .from("donation_allocations")
    .insert({
      wedding_id: ctx.session.wedding.id,
      donation_id: values.donationId,
      category_id: values.categoryId,
      label: values.label,
      amount: values.amount,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { error: actionError(error ?? { message: "" }, ctx.copy) };
  }

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "allocation",
    recordId: created.id,
    amounts: amountConversion,
  });
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

  const amountConversion = await convertInputAmounts(
    ctx.supabase,
    ctx.session.userId,
    [parsed.values.amount],
  );
  if (!amountConversion) return { error: ratesError(ctx.locale) };
  const values = { ...parsed.values, amount: amountConversion.idr[0] };

  const validation = await validateAllocation(ctx, values, id);
  if (validation) return { error: validation };

  const { error } = await ctx.supabase
    .from("donation_allocations")
    .update({
      donation_id: values.donationId,
      category_id: values.categoryId,
      label: values.label,
      amount: values.amount,
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);
  if (error) return { error: actionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "allocation",
    recordId: id,
    amounts: amountConversion,
  });
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
