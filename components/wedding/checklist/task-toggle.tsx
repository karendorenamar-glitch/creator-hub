"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toggleTaskAction } from "@/app/wedding/(app)/checklist/actions";
import type { ActionResult } from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function TaskToggle({
  id,
  completed,
  copy,
}: {
  id: string;
  completed: boolean;
  copy: ModuleCopy;
}) {
  const [, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => toggleTaskAction(formData),
    null,
  );

  return (
    <form action={formAction} className="inline-flex flex-col">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="completed" value={completed ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        aria-label={completed ? copy.checklist.reopen : copy.checklist.markDone}
        title={completed ? copy.checklist.reopen : copy.checklist.markDone}
        className={`rounded-full p-0.5 transition-colors disabled:opacity-50 ${
          completed ? "text-emerald-500" : "text-blush-300 hover:text-blush-500"
        }`}
      >
        <CheckCircle2 className="size-5" aria-hidden />
      </button>
    </form>
  );
}
