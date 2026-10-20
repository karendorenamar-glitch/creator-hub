"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

type DeleteAction = (formData: FormData) => Promise<ActionResult>;

/**
 * Two-step delete. RLS still decides whether the delete is allowed; if it is
 * rejected (for example by an inactive subscription) the error is shown here.
 */
export function DeleteForm({
  action,
  id,
  copy,
  label,
}: {
  action: DeleteAction;
  id: string;
  copy: ModuleCopy;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    null,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600"
        aria-label={label ?? copy.form.delete}
      >
        <Trash2 className="size-3.5" aria-hidden />
        {label ?? copy.form.delete}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="inline-flex flex-wrap items-center gap-1.5 align-middle"
    >
      <input type="hidden" name="id" value={id} />
      {state?.error ? (
        <span className="w-full text-xs text-rose-600">{state.error}</span>
      ) : null}
      <span className="text-xs text-rose-600">{copy.form.confirmDelete}</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? copy.form.saving : copy.form.yesDelete}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-2 py-1 text-xs text-ink-soft hover:bg-olive-50"
      >
        {copy.form.cancel}
      </button>
    </form>
  );
}
