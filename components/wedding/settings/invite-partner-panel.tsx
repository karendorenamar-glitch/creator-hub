"use client";

import { useActionState, useState } from "react";
import { Copy, Send, UserRoundCheck } from "lucide-react";
import {
  createWeddingInviteAction,
  revokeWeddingInviteAction,
} from "@/app/wedding/(app)/settings/invite-actions";
import { FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { WeddingInvite } from "@/lib/wedding/db-types";
import { formatDateTime } from "@/lib/wedding/format";
import type { WeddingCopy } from "@/lib/wedding/copy";

export function InvitePartnerPanel({
  canInvite,
  hasPartner,
  pendingInvite,
  copy,
  locale,
}: {
  canInvite: boolean;
  hasPartner: boolean;
  pendingInvite: WeddingInvite | null;
  copy: WeddingCopy;
  locale: "en" | "id";
}) {
  const [state, formAction, pending] = useActionState(
    createWeddingInviteAction,
    null,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    async (_prev: unknown, formData: FormData) =>
      revokeWeddingInviteAction(formData),
    null,
  );
  const [copied, setCopied] = useState(false);
  const invitePath = pendingInvite
    ? `/wedding/invite/${pendingInvite.token}`
    : null;

  async function copyLink() {
    if (!invitePath || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <UserRoundCheck className="size-4 text-petal-400" aria-hidden />
            {copy.settings.inviteTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {copy.settings.inviteSubtitle}
          </p>
        </div>
        {hasPartner ? (
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {copy.settings.inviteAlreadyMember}
          </span>
        ) : null}
      </div>

      {!canInvite ? (
        <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-sm text-ink-soft">
          {copy.settings.inviteOwnerOnly}
        </p>
      ) : hasPartner ? null : pendingInvite ? (
        <div className="space-y-3 rounded-2xl border border-petal-100 bg-petal-50/40 p-4">
          <p className="text-sm font-medium text-ink">
            {copy.settings.inviteReady}
          </p>
          {pendingInvite.expires_at ? (
            <p className="text-xs text-ink-soft">
              {copy.settings.inviteExpires}:{" "}
              {formatDateTime(pendingInvite.expires_at, locale)}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={invitePath ?? ""}
              readOnly
              aria-label={copy.settings.inviteShare}
              className={`${inputClass} min-w-0 flex-1 bg-white/80`}
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
            >
              <Copy className="size-4" aria-hidden />
              {copied ? copy.settings.inviteCopied : copy.settings.inviteCopy}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
            {copy.settings.inviteHint}
          </p>
          <form action={revokeAction}>
            <input type="hidden" name="id" value={pendingInvite.id} />
            {revokeState?.error ? (
              <p className="mb-2 text-xs text-rose-600">{revokeState.error}</p>
            ) : null}
            <button
              type="submit"
              disabled={revokePending}
              className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
            >
              {revokePending ? copy.common.saving : copy.settings.inviteRevoke}
            </button>
          </form>
        </div>
      ) : (
        <form
          action={formAction}
          className="space-y-3 rounded-2xl border border-petal-100 bg-petal-50/40 p-4"
        >
          <FormAlert error={state?.error} success={state?.success} />
          <p className="text-xs leading-relaxed text-ink-soft">
            {copy.settings.inviteHint}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden />
            {pending ? copy.common.saving : copy.settings.inviteCreate}
          </button>
        </form>
      )}
    </div>
  );
}
