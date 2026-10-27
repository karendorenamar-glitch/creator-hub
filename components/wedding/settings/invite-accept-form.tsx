"use client";

import { useActionState } from "react";
import { acceptWeddingInviteLinkAction } from "@/app/wedding/invite/actions";
import { FormAlert } from "@/components/wedding/form-kit";
import type { WeddingCopy } from "@/lib/wedding/copy";

export function InviteAcceptForm({
  token,
  copy,
}: {
  token: string;
  copy: WeddingCopy;
}) {
  const [state, formAction, pending] = useActionState(
    acceptWeddingInviteLinkAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <FormAlert error={state?.error} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
      >
        {pending
          ? copy.settings.inviteAccepting
          : copy.settings.inviteAcceptButton}
      </button>
    </form>
  );
}
