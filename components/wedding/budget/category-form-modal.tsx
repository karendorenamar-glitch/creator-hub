"use client";

import { CurrencyField } from "@/components/wedding/currency-field";
import { useCurrencyReset } from "@/lib/currency/use-currency-reset";
import { useActionState, useEffect } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/wedding/(app)/budget/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { BudgetCategory } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { useMoney } from "@/components/wedding/currency-provider";

export function CategoryFormModal({
  open,
  onClose,
  copy,
  category,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  category: BudgetCategory | null;
}) {
  const action = category ? updateCategoryAction : createCategoryAction;
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
      title={category ? copy.budget.editCategory : copy.budget.addCategory}
    >
      <form action={formAction} className="space-y-4">
        <CurrencyField />
        {category ? <input type="hidden" name="id" value={category.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.budget.categoryName} htmlFor="category-name">
          <input
            id="category-name"
            name="name"
            required
            maxLength={80}
            defaultValue={category?.name ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.budget.planned} (${money.currency})`}
          htmlFor="category-planned"
        >
          <input
            id="category-planned"
            name="plannedAmount"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            defaultValue={
              category ? money.toInput(category.planned_amount) : ""
            }
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
