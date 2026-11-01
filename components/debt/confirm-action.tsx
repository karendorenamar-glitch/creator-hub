"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import type { DebtActionResult } from "@/app/debt/actions";

type DebtAction = (formData: FormData) => Promise<DebtActionResult>;

export function ConfirmAction({
  action,
  fields,
  label,
  confirmLabel,
  message,
  withReason = false,
  tone = "danger",
}: {
  action: DebtAction;
  fields: Record<string, string>;
  label: string;
  confirmLabel: string;
  message: string;
  withReason?: boolean;
  tone?: "danger" | "neutral";
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<
    DebtActionResult,
    FormData
  >(async (_prev, formData) => (await action(formData)) ?? null, null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          tone === "danger"
            ? "rounded-lg px-2 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
            : "rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-olive-50"
        }
      >
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-2 rounded-xl bg-[#fbf7f2] p-3">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state?.error ? (
        <p role="alert" className="text-xs text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-xs text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <p className="text-xs text-cocoa/65">{message}</p>
      {withReason ? (
        <input
          name="reason"
          maxLength={500}
          placeholder="Alasan (opsional)"
          className="w-full rounded-lg border border-olive-100 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-olive-400"
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
          {pending ? "Memproses…" : confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
