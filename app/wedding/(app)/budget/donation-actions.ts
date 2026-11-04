"use server";

import { submittedCurrencyIsStale } from "@/lib/currency/action";
import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { isUuid, parseWholeRupiah, text } from "@/lib/wedding/validation";
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


function ratesError(locale: "en" | "id") {
  return locale === "en"
    ? "Exchange rates are unavailable right now. Nothing was saved; please try again shortly."
    : "Kurs mata uang sedang tidak tersedia. Belum ada yang disimpan; coba lagi sebentar lagi.";
}

export async function createDonationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const submittedCurrency = text(formData, "displayCurrency");
  if (
    await submittedCurrencyIsStale(
      ctx.supabase,
      ctx.session.userId,
      submittedCurrency,
    )
  ) {
    return {
      error:
        ctx.locale === "en"
          ? "The display currency changed. Reopen this form and try again."
          : "Mata uang tampilan berubah. Buka ulang form ini lalu coba lagi.",
    };
  }
  const parsed = readDonation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const amountConversion = await convertInputAmounts(
    ctx.supabase,
    ctx.session.userId,
    [parsed.amount],
  );
  if (!amountConversion) return { error: ratesError(ctx.locale) };

  const { data: created, error } = await ctx.supabase
    .from("wedding_donations")
    .insert({
      wedding_id: ctx.session.wedding.id,
      donor_name: parsed.donorName,
      amount: amountConversion.idr[0],
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: actionError(error ?? { message: "" }, ctx.copy) };
  }

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "donation",
    recordId: created.id,
    amounts: amountConversion,
  });

  revalidateWedding("/wedding/budget");
  return { success: ctx.copy.form.saved };
}

export async function updateDonationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const submittedCurrency = text(formData, "displayCurrency");
  if (
    await submittedCurrencyIsStale(
      ctx.supabase,
      ctx.session.userId,
      submittedCurrency,
    )
  ) {
    return {
      error:
        ctx.locale === "en"
          ? "The display currency changed. Reopen this form and try again."
          : "Mata uang tampilan berubah. Buka ulang form ini lalu coba lagi.",
    };
  }
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readDonation(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const amountConversion = await convertInputAmounts(
    ctx.supabase,
    ctx.session.userId,
    [parsed.amount],
  );
  if (!amountConversion) return { error: ratesError(ctx.locale) };
  const amountIdr = amountConversion.idr[0];

  const { data: allocations } = await ctx.supabase
    .from("donation_allocations")
    .select("amount")
    .eq("donation_id", id)
    .eq("wedding_id", ctx.session.wedding.id);
  const allocated = (allocations ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );
  if (amountIdr < allocated) {
    return { error: ctx.copy.budget.donationBelowAllocation };
  }

  const { error } = await ctx.supabase
    .from("wedding_donations")
    .update({ donor_name: parsed.donorName, amount: amountIdr })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "donation",
    recordId: id,
    amounts: amountConversion,
  });

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
