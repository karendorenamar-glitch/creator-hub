"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { deleteExpenseAction } from "@/app/wedding/(app)/budget/actions";
import { ExpenseFormModal } from "@/components/wedding/budget/expense-form-modal";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { Badge } from "@/components/wedding/ui";
import type { BudgetCategory, Expense } from "@/lib/wedding/db-types";
import { daysFromToday, formatIDR, formatWeddingDate } from "@/lib/wedding/format";
import { label } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const statusTone = {
  paid: "success",
  partially_paid: "warning",
  deposit_paid: "warning",
  unpaid: "muted",
} as const;

export function ExpenseManager({
  expenses,
  categories,
  vendors,
  copy,
  locale,
}: {
  expenses: Expense[];
  categories: BudgetCategory[];
  vendors: { id: string; name: string }[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const vendorNames = useMemo(
    () => new Map(vendors.map((vendor) => [vendor.id, vendor.name])),
    [vendors],
  );

  const filtered = expenses.filter((expense) => {
    if (categoryFilter !== "all" && expense.category_id !== categoryFilter) {
      return false;
    }
    if (statusFilter !== "all" && expense.payment_status !== statusFilter) {
      return false;
    }
    return true;
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {copy.budget.expenses}
          </h2>
          <p className="text-sm text-ink-soft">{copy.budget.expensesHint}</p>
        </div>
        <AddButton label={copy.budget.addExpense} onClick={openCreate} />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label={copy.budget.category}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.budget.filterAll}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={copy.vendors.paymentStatus}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.vendors.allStatuses}</option>
          {(["unpaid", "deposit_paid", "partially_paid", "paid"] as const).map(
            (status) => (
              <option key={status} value={status}>
                {label("paymentStatus", status, locale)}
              </option>
            ),
          )}
        </select>
      </div>

      {expenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.budget.noExpenses}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.budget.emptyFilter}
        </p>
      ) : (
        <ul className="divide-y divide-olive-100 rounded-2xl border border-olive-100 bg-white">
          {filtered.map((expense) => {
            const days = daysFromToday(expense.due_date);
            const overdue =
              days !== null && days < 0 && expense.payment_status !== "paid";
            return (
              <li
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {expense.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {expense.category_id
                      ? categoryNames.get(expense.category_id) ??
                        copy.budget.uncategorized
                      : copy.budget.uncategorized}
                    {expense.vendor_id
                      ? ` · ${vendorNames.get(expense.vendor_id) ?? ""}`
                      : ""}
                    {expense.due_date
                      ? ` · ${formatWeddingDate(expense.due_date, locale)}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink">
                      {formatIDR(expense.amount)}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {formatIDR(expense.amount_paid)} {copy.budget.paidOf}
                    </p>
                  </div>
                  <Badge tone={statusTone[expense.payment_status]}>
                    {label("paymentStatus", expense.payment_status, locale)}
                  </Badge>
                  {overdue ? (
                    <Badge tone="warning">{copy.checklist.overdue}</Badge>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEdit(expense)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {copy.form.edit}
                  </button>
                  <DeleteForm
                    action={deleteExpenseAction}
                    id={expense.id}
                    copy={copy}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        expense={editing}
        categories={categories}
        vendors={vendors}
      />
    </div>
  );
}
