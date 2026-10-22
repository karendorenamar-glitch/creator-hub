"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  approvePaymentAction,
  rejectPaymentAction,
} from "@/app/admin/payments/actions";

export type AdminActionResult = { error?: string; success?: string } | null;

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {pending ? "Memproses…" : "Setujui & aktifkan akses"}
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-rose-200 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-60"
    >
      {pending ? "Memproses…" : "Tolak"}
    </button>
  );
}

/** Approve/reject with visible pending and error states. */
export function PaymentDecision({ paymentId }: { paymentId: string }) {
  const [approveState, approveAction] = useActionState(
    approvePaymentAction,
    null as AdminActionResult,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectPaymentAction,
    null as AdminActionResult,
  );

  const error = approveState?.error ?? rejectState?.error;
  const success = approveState?.success ?? rejectState?.success;

  return (
    <div className="space-y-3 border-t border-blush/60 pt-3">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
        >
          {success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <form action={approveAction}>
          <input type="hidden" name="paymentId" value={paymentId} />
          <ApproveButton />
        </form>

        <form action={rejectAction} className="flex items-end gap-2">
          <input type="hidden" name="paymentId" value={paymentId} />
          <input
            name="reason"
            placeholder="Alasan penolakan"
            className="rounded-xl border border-blush bg-white px-3 py-2 text-xs"
          />
          <RejectButton />
        </form>
      </div>
    </div>
  );
}