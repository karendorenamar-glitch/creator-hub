"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  saveMonthlyAmountsAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { AccountSummary } from "@/lib/debt/calculations";
import { addMonthsISO, monthLabel, todayISO } from "@/lib/debt/format";

export function MonthlyAmountsForm({
  account,
  onDone,
}: {
  account: AccountSummary;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<DebtActionResult, FormData>(
    saveMonthlyAmountsAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state?.success, onDone, router]);

  const start = account.due_date ?? todayISO();
  const months = account.monthlyAmounts;
  const dueDay = account.due_day ?? Number(start.slice(8, 10));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={account.id} />
      <FormAlert error={state?.error} />

      <div>
        <p className="font-medium text-ink">{account.creditor_name}</p>
        <p className="mt-1 text-xs text-ink-soft">
          {account.installment_month}/{account.installment_total_months} bulan
          sudah dibayar · tanggal tetap tanggal {dueDay}
        </p>
      </div>

      <div className="space-y-2">
        {months.map((amount, index) => {
          const month = monthLabel(
            addMonthsISO(start, index).slice(0, 7),
          );
          return (
            <div
              key={`${month}-${index}`}
              className="grid grid-cols-[1fr_1.1fr] items-center gap-2"
            >
              <span className="text-sm text-ink-soft">{month}</span>
              <input
                name="amount"
                inputMode="numeric"
                required
                defaultValue={amount > 0 ? String(amount) : ""}
                placeholder="Nominal"
                aria-label={`Nominal ${month}`}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>

      <p className="rounded-xl bg-olive-50 px-3 py-2 text-xs text-ink-soft">
        Nominal boleh berbeda tiap bulan. Tanggal tagihan tetap sama.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Menyimpan…" : "Simpan nominal"}
      </button>
    </form>
  );
}
