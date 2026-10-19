"use client";

import { useActionState } from "react";
import { updateBudgetAction } from "@/app/wedding/(app)/budget/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function TotalBudgetForm({
  copy,
  totalBudget,
}: {
  copy: ModuleCopy;
  totalBudget: number;
}) {
  const [state, formAction, pending] = useActionState(updateBudgetAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={copy.budget.totalBudgetLabel} className="min-w-52 flex-1">
          <input
            name="totalBudget"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            defaultValue={totalBudget}
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blush-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blush-600 disabled:opacity-60"
        >
          {pending ? copy.form.saving : copy.budget.updateBudget}
        </button>
      </div>
      <FormAlert error={state?.error} success={state?.success} />
    </form>
  );
}
