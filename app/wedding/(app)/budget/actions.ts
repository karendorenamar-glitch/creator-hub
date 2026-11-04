"use server";

import { submittedCurrencyIsStale } from "@/lib/currency/action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { PaymentStatus } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { syncDonorAllocationForCost } from "@/lib/wedding/donation-allocation-sync";
import {
  convertAmountsWithCurrency,
  convertInputAmounts,
  recordFinancialEntry,
} from "@/lib/currency/action";
import {
  hasStoredCurrencyPreference,
  saveCurrencyPreference,
} from "@/lib/currency/server";
import {
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/currency/currencies";
import {
  enumValue,
  isDateString,
  isUuid,
  optionalText,
  optionalUuid,
  parseMoney,
  parseWholeRupiah,
  paymentStatusFor,
  text,
} from "@/lib/wedding/validation";

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

function budgetPaths() {
  revalidateWedding("/wedding/budget");
}

function ratesError(locale: "en" | "id") {
  return locale === "en"
    ? "Exchange rates are unavailable right now. Nothing was saved; please try again in a few minutes."
    : "Kurs mata uang sedang tidak tersedia. Belum ada yang disimpan; coba lagi beberapa menit lagi.";
}

export async function updateBudgetAction(
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
  const raw = text(formData, "totalBudget");
  // Empty means "unset", stored as 0. Reject negatives/scientific notation.
  const amount = raw === "" ? 0 : parseWholeRupiah(raw, { allowZero: true });

  if (amount === null) return { error: ctx.copy.form.invalidNumber };

  // First entry: the dropdown sets the primary currency. Once a preference
  // exists (Settings or an earlier save) it is never overwritten here.
  const alreadyChosen = await hasStoredCurrencyPreference(
    ctx.supabase,
    ctx.session.userId,
  );
  const submitted = text(formData, "currency");
  let chosen: CurrencyCode | null = null;

  if (!alreadyChosen && isCurrencyCode(submitted)) {
    chosen = submitted;
  }

  const converted = chosen
    ? await convertAmountsWithCurrency(ctx.supabase, chosen, [amount])
    : await convertInputAmounts(ctx.supabase, ctx.session.userId, [amount]);
  if (!converted) return { error: ratesError(ctx.locale) };

  // Persist the first choice only after the amount converted cleanly: a failed
  // conversion must not lock the customer into a currency with no valid base.
  if (chosen) {
    const saved = await saveCurrencyPreference(
      ctx.supabase,
      ctx.session.userId,
      chosen,
    );
    if (!saved) return { error: ctx.copy.errors.generic };
    // The display currency lives in the app layout, so the layout has to be
    // invalidated for the reactive store to receive the first choice without a
    // page reload.
    revalidatePath("/wedding", "layout");
  }

  const { error } = await ctx.supabase
    .from("weddings")
    .update({ total_budget: converted.idr[0] })
    .eq("id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "wedding_budget",
    recordId: ctx.session.wedding.id,
    amounts: converted,
  });

  budgetPaths();
  return { success: ctx.copy.budget.budgetUpdated };
}

export async function createCategoryAction(
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
  const name = text(formData, "name").slice(0, 80);
  const planned = parseMoney(text(formData, "plannedAmount")) ?? 0;

  if (!name) return { error: ctx.copy.form.required };

  const converted = await convertInputAmounts(ctx.supabase, ctx.session.userId, [planned]);
  if (!converted) return { error: ratesError(ctx.locale) };

  const { data: created, error } = await ctx.supabase
    .from("budget_categories")
    .insert({
      wedding_id: ctx.session.wedding.id,
      name,
      planned_amount: converted.idr[0],
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error) return { error: actionError(error, ctx.copy) };

  if (created?.id) {
    await recordFinancialEntry(ctx.supabase, {
      userId: ctx.session.userId,
      module: "budget_category",
      recordId: created.id,
      amounts: converted,
    });
  }

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function updateCategoryAction(
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
  const name = text(formData, "name").slice(0, 80);
  const planned = parseMoney(text(formData, "plannedAmount")) ?? 0;

  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };
  if (!name) return { error: ctx.copy.form.required };

  const converted = await convertInputAmounts(ctx.supabase, ctx.session.userId, [planned]);
  if (!converted) return { error: ratesError(ctx.locale) };

  const { error } = await ctx.supabase
    .from("budget_categories")
    .update({ name, planned_amount: converted.idr[0] })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "budget_category",
    recordId: id,
    amounts: converted,
  });

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function deleteCategoryAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");

  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  // Expenses keep their wedding_id and become uncategorized (ON DELETE SET NULL).
  const { error } = await ctx.supabase
    .from("budget_categories")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return null;
}

type ExpenseValues = {
  name: string;
  amount: number;
  amount_paid: number;
  deposit_amount: number;
  payment_status: ReturnType<typeof paymentStatusFor>;
  category_id: string | null;
  vendor_id: string | null;
  due_date: string | null;
  notes: string | null;
};

function readExpense(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: ExpenseValues } | { ok: false; error: string } {
  const name = text(formData, "name").slice(0, 120);
  if (!name) return { ok: false, error: copy.form.required };

  const amount = parseMoney(text(formData, "amount"));
  if (amount === null) return { ok: false, error: copy.form.invalidNumber };

  const amountPaid = parseMoney(text(formData, "amountPaid")) ?? 0;
  const deposit = parseMoney(text(formData, "depositAmount")) ?? 0;

  if (amountPaid > amount || deposit > amount) {
    return { ok: false, error: copy.errors.invalid };
  }

  const dueDate = text(formData, "dueDate");
  if (dueDate && !isDateString(dueDate)) {
    return { ok: false, error: copy.form.invalidDate };
  }

  return {
    ok: true,
    values: {
      name,
      amount,
      amount_paid: amountPaid,
      deposit_amount: deposit,
      payment_status: paymentStatusFor(amount, amountPaid),
      category_id: optionalUuid(formData, "categoryId"),
      vendor_id: optionalUuid(formData, "vendorId"),
      due_date: dueDate || null,
      notes: optionalText(formData, "notes", 2000),
    },
  };
}

export async function createExpenseAction(
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
  const parsed = readExpense(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const converted = await convertInputAmounts(ctx.supabase, ctx.session.userId, [
    parsed.values.amount,
    parsed.values.amount_paid,
    parsed.values.deposit_amount,
  ]);
  if (!converted) return { error: ratesError(ctx.locale) };

  const { data: created, error } = await ctx.supabase
    .from("expenses")
    .insert({
      wedding_id: ctx.session.wedding.id,
      ...parsed.values,
      amount: converted.idr[0],
      amount_paid: converted.idr[1],
      deposit_amount: converted.idr[2],
    })
    .select("id")
    .single();

  if (error) return { error: actionError(error, ctx.copy) };

  if (created?.id) {
    await recordFinancialEntry(ctx.supabase, {
      userId: ctx.session.userId,
      module: "expense",
      recordId: created.id,
      amounts: converted,
    });
  }

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function updateExpenseAction(
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

  const parsed = readExpense(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const converted = await convertInputAmounts(ctx.supabase, ctx.session.userId, [
    parsed.values.amount,
    parsed.values.amount_paid,
    parsed.values.deposit_amount,
  ]);
  if (!converted) return { error: ratesError(ctx.locale) };

  const { error } = await ctx.supabase
    .from("expenses")
    .update({
      ...parsed.values,
      amount: converted.idr[0],
      amount_paid: converted.idr[1],
      deposit_amount: converted.idr[2],
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "expense",
    recordId: id,
    amounts: converted,
  });

  budgetPaths();
  return { success: ctx.copy.form.saved };
}


const OTHER_COST_STATUSES = ["unpaid", "partial", "paid", "donor"] as const;

type OtherCostValues = {
  name: string;
  amount: number;
  paidAmount: number;
  status: (typeof OTHER_COST_STATUSES)[number];
};

function readOtherCost(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: OtherCostValues } | { ok: false; error: string } {
  const name = text(formData, "name").slice(0, 120);
  if (!name) return { ok: false, error: copy.form.required };

  const amount = parseWholeRupiah(text(formData, "amount"), {
    allowZero: true,
  });
  if (amount === null) {
    return { ok: false, error: copy.form.invalidNumber };
  }

  const status = enumValue(
    formData,
    "status",
    OTHER_COST_STATUSES,
    "unpaid",
  );
  let paidAmount = 0;

  if (status === "paid") {
    paidAmount = amount;
  } else if (status === "partial") {
    const parsedPaid = parseWholeRupiah(text(formData, "amountPaid"));
    if (parsedPaid === null || parsedPaid <= 0 || parsedPaid >= amount) {
      return { ok: false, error: copy.budget.otherCostPartialInvalid };
    }
    paidAmount = parsedPaid;
  }

  return {
    ok: true,
    values: {
      name,
      amount,
      paidAmount,
      status,
    },
  };
}

function otherCostRow(values: OtherCostValues) {
  return {
    name: values.name,
    amount: values.amount,
    amount_paid: values.paidAmount,
    deposit_amount: 0,
    payment_status: (values.status === "paid" || values.status === "donor"
      ? "lunas"
      : values.status === "partial"
        ? "dp"
        : "diskusi") as PaymentStatus,
    funded_by_donor: values.status === "donor",
    category_id: null,
    vendor_id: null,
    due_date: null,
    notes: null,
  };
}

export async function createOtherCostAction(
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
  const parsed = readOtherCost(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const converted = await convertInputAmounts(ctx.supabase, ctx.session.userId, [
    parsed.values.amount,
    parsed.values.paidAmount,
  ]);
  if (!converted) return { error: ratesError(ctx.locale) };

  const storedValues = {
    ...parsed.values,
    amount: converted.idr[0],
    paidAmount: converted.idr[1],
  };

  const values = {
    wedding_id: ctx.session.wedding.id,
    ...otherCostRow(storedValues),
  };
  let { data: created, error } = await ctx.supabase
    .from("expenses")
    .insert(values)
    .select("id")
    .single();
  if (error?.code === "42703") {
    const { funded_by_donor, ...legacyValues } = values;
    void funded_by_donor;
    const retry = await ctx.supabase
      .from("expenses")
      .insert(legacyValues)
      .select("id")
      .single();
    created = retry.data;
    error = retry.error;
  }

  if (error) return { error: actionError(error, ctx.copy) };
  if (created?.id) {
    await recordFinancialEntry(ctx.supabase, {
      userId: ctx.session.userId,
      module: "other_cost",
      recordId: created.id,
      amounts: converted,
    });
    await syncDonorAllocationForCost(ctx.supabase, ctx.session.wedding.id, {
      expenseId: created.id,
      label: parsed.values.name,
      amount: storedValues.amount,
      fundedByDonor: parsed.values.status === "donor",
    });
  }

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function updateOtherCostAction(
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

  const parsed = readOtherCost(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const converted = await convertInputAmounts(ctx.supabase, ctx.session.userId, [
    parsed.values.amount,
    parsed.values.paidAmount,
  ]);
  if (!converted) return { error: ratesError(ctx.locale) };

  const storedValues = {
    ...parsed.values,
    amount: converted.idr[0],
    paidAmount: converted.idr[1],
  };

  const values = otherCostRow(storedValues);
  let { error } = await ctx.supabase
    .from("expenses")
    .update(values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .is("vendor_id", null);
  if (error?.code === "42703") {
    const { funded_by_donor, ...legacyValues } = values;
    void funded_by_donor;
    const retry = await ctx.supabase
      .from("expenses")
      .update(legacyValues)
      .eq("id", id)
      .eq("wedding_id", ctx.session.wedding.id)
      .is("vendor_id", null);
    error = retry.error;
  }

  if (error) return { error: actionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "other_cost",
    recordId: id,
    amounts: converted,
  });

  await syncDonorAllocationForCost(ctx.supabase, ctx.session.wedding.id, {
    expenseId: id,
    label: parsed.values.name,
    amount: storedValues.amount,
    fundedByDonor: parsed.values.status === "donor",
  });

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function deleteOtherCostAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .is("vendor_id", null);

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return null;
}

export async function deleteExpenseAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return null;
}
