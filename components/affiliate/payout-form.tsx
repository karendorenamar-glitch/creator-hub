"use client";

import { useActionState } from "react";
import { requestPayoutAction, type PayoutState } from "@/app/affiliate/payout/actions";

const field =
  "mt-1 w-full rounded-xl border border-blush/70 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rosewood";

export function PayoutForm({
  bankName,
  accountHolder,
  accountNumber,
}: {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}) {
  const [state, action, pending] = useActionState<PayoutState, FormData>(
    requestPayoutAction,
    null,
  );

  return (
    <form action={action} className="mt-6 space-y-3">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Payout requested. An admin will process it.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-ink">
          Currency
          <select name="currency" className={field} defaultValue="IDR">
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="text-xs font-medium text-ink">
          Amount
          <input name="amount" type="number" step="0.01" min="0" required className={field} />
        </label>
        <label className="text-xs font-medium text-ink">
          Bank name
          <input name="bankName" required defaultValue={bankName} className={field} />
        </label>
        <label className="text-xs font-medium text-ink">
          Account holder
          <input name="accountHolder" required defaultValue={accountHolder} className={field} />
        </label>
        <label className="text-xs font-medium text-ink sm:col-span-2">
          Account number
          <input name="accountNumber" required defaultValue={accountNumber} className={field} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-rosewood px-5 py-2.5 text-sm font-medium text-ivory hover:bg-cocoa disabled:opacity-60"
      >
        {pending ? "Requesting…" : "Request Payout"}
      </button>
      <p className="text-[11px] text-ink-soft">
        Minimum Rp6,000 for IDR and $0.60 for USD. IDR and USD are paid separately.
      </p>
    </form>
  );
}
