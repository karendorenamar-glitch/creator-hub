"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  payDebtInstallmentAction,
  type DebtActionResult,
} from "@/app/debt/actions";

export function MarkPaidButton({
  accountId,
  amountLabel,
}: {
  accountId: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<DebtActionResult, FormData>(
    async (_prev, formData) => (await payDebtInstallmentAction(formData)) ?? null,
    null,
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={action} className="mt-3 space-y-1">
      <input type="hidden" name="id" value={accountId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-olive-200 bg-white px-2.5 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-50 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Check className="size-3.5" aria-hidden />
        )}
        {pending ? "Menyimpan…" : `Sudah bayar ${amountLabel}`}
      </button>
      {state?.error ? (
        <p role="alert" className="text-[11px] leading-snug text-rose-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
