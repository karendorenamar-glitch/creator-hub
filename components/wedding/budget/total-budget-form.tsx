"use client";

import { useActionState } from "react";
import { updateBudgetAction } from "@/app/wedding/(app)/budget/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { useMoney } from "@/components/wedding/currency-provider";
import { CURRENCIES } from "@/lib/currency/currencies";

export function TotalBudgetForm({
  copy,
  totalBudget,
  hasCurrencyPreference,
}: {
  copy: ModuleCopy;
  totalBudget: number;
  hasCurrencyPreference: boolean;
}) {
  const money = useMoney();
  const [state, formAction, pending] = useActionState(updateBudgetAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label={`${copy.budget.totalBudgetLabel.replace(" (IDR)", "")} (${money.currency})`}
          className="min-w-52 flex-1"
        >
          <input
            name="totalBudget"
            type="number"
            min={0}
            step={money.currency === "IDR" || money.currency === "JPY" ? 1000 : 0.01}
            inputMode="numeric"
            defaultValue={money.toInput(totalBudget)}
            className={inputClass}
          />
        </Field>
        <Field label="Currency">
          {hasCurrencyPreference ? (
            <p className="rounded-xl border border-olive-100 bg-olive-50 px-3 py-2.5 text-sm font-medium text-ink">
              {CURRENCIES.find((item) => item.code === money.currency)?.flag}{" "}
              {money.currency}
            </p>
          ) : (
            <select
              name="currency"
              defaultValue={money.currency}
              className={inputClass}
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.code} ({item.symbol})
                </option>
              ))}
            </select>
          )}
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
        >
          {pending ? copy.form.saving : copy.budget.updateBudget}
        </button>
      </div>
      <FormAlert error={state?.error} success={state?.success} />
    </form>
  );
}
