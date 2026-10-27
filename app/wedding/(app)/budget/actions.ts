"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { PaymentStatus } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
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

export async function updateBudgetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const raw = text(formData, "totalBudget");
  // Empty means "unset", stored as 0. Reject negatives/scientific notation.
  const amount = raw === "" ? 0 : parseWholeRupiah(raw, { allowZero: true });

  if (amount === null) return { error: ctx.copy.form.invalidNumber };

  const { error } = await ctx.supabase
    .from("weddings")
    .update({ total_budget: amount })
    .eq("id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return { success: ctx.copy.budget.budgetUpdated };
}

export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const name = text(formData, "name").slice(0, 80);
  const planned = parseMoney(text(formData, "plannedAmount")) ?? 0;

  if (!name) return { error: ctx.copy.form.required };

  const { error } = await ctx.supabase.from("budget_categories").insert({
    wedding_id: ctx.session.wedding.id,
    name,
    planned_amount: planned,
    sort_order: 0,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function updateCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  const name = text(formData, "name").slice(0, 80);
  const planned = parseMoney(text(formData, "plannedAmount")) ?? 0;

  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };
  if (!name) return { error: ctx.copy.form.required };

  const { error } = await ctx.supabase
    .from("budget_categories")
    .update({ name, planned_amount: planned })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

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
  const parsed = readExpense(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase.from("expenses").insert({
    wedding_id: ctx.session.wedding.id,
    ...parsed.values,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function updateExpenseAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readExpense(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase
    .from("expenses")
    .update(parsed.values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

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
  const parsed = readOtherCost(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const values = {
    wedding_id: ctx.session.wedding.id,
    ...otherCostRow(parsed.values),
  };
  let { error } = await ctx.supabase.from("expenses").insert(values);
  if (error?.code === "42703") {
    const { funded_by_donor, ...legacyValues } = values;
    void funded_by_donor;
    const retry = await ctx.supabase.from("expenses").insert(legacyValues);
    error = retry.error;
  }

  if (error) return { error: actionError(error, ctx.copy) };

  budgetPaths();
  return { success: ctx.copy.form.saved };
}

export async function updateOtherCostAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readOtherCost(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const values = otherCostRow(parsed.values);
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
