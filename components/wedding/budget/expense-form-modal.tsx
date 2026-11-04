"use client";

import { CurrencyField } from "@/components/wedding/currency-field";
import { useCurrencyReset } from "@/lib/currency/use-currency-reset";
import { useActionState, useEffect } from "react";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/app/wedding/(app)/budget/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { BudgetCategory, Expense } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { useMoney } from "@/components/wedding/currency-provider";

export function ExpenseFormModal({
  open,
  onClose,
  copy,
  expense,
  categories,
  vendors,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  expense: Expense | null;
  categories: BudgetCategory[];
  vendors: { id: string; name: string }[];
}) {
  const action = expense ? updateExpenseAction : createExpenseAction;
  const money = useMoney();
  const [state, formAction, pending] = useActionState(action, null);
  useCurrencyReset(onClose);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={expense ? copy.budget.editExpense : copy.budget.addExpense}
    >
      <form action={formAction} className="space-y-4">
        <CurrencyField />
        {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.budget.expenseName} htmlFor="expense-name">
          <input
            id="expense-name"
            name="name"
            required
            maxLength={120}
            defaultValue={expense?.name ?? ""}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={`${copy.budget.amount} (${money.currency})`}
            htmlFor="expense-amount"
          >
            <input
              id="expense-amount"
              name="amount"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              required
              defaultValue={expense ? money.toInput(expense.amount) : ""}
              className={inputClass}
            />
          </Field>
          <Field
            label={`${copy.budget.amountPaid} (${money.currency})`}
            htmlFor="expense-paid"
          >
            <input
              id="expense-paid"
              name="amountPaid"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={expense ? money.toInput(expense.amount_paid) : ""}
              className={inputClass}
            />
          </Field>
          <Field label={copy.budget.category} htmlFor="expense-category">
            <select
              id="expense-category"
              name="categoryId"
              defaultValue={expense?.category_id ?? ""}
              className={inputClass}
            >
              <option value="">{copy.budget.uncategorized}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.budget.vendor} htmlFor="expense-vendor">
            <select
              id="expense-vendor"
              name="vendorId"
              defaultValue={expense?.vendor_id ?? ""}
              className={inputClass}
            >
              <option value="">{copy.form.none}</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.budget.dueDate} htmlFor="expense-due">
            <input
              id="expense-due"
              name="dueDate"
              type="date"
              defaultValue={expense?.due_date ?? ""}
              className={inputClass}
            />
          </Field>
          <Field
            label={`${copy.vendors.deposit} (${money.currency}) (${copy.form.optional})`}
            htmlFor="expense-deposit"
          >
            <input
              id="expense-deposit"
              name="depositAmount"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={expense ? money.toInput(expense.deposit_amount) : ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={`${copy.budget.notes} (${copy.form.optional})`} htmlFor="expense-notes">
          <textarea
            id="expense-notes"
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={expense?.notes ?? ""}
            className={inputClass}
          />
        </Field>

        <ModalFooter
          pending={pending}
          submitLabel={copy.form.save}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}
