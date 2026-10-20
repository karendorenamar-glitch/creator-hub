"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitRsvpAction, type RsvpState } from "@/app/i/[slug]/rsvp-actions";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const fieldClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive-400 focus:ring-2 focus:ring-olive-100";

export function RsvpForm({
  slug,
  copy,
}: {
  slug: string;
  copy: ModuleCopy;
}) {
  const [state, formAction, pending] = useActionState<RsvpState, FormData>(
    submitRsvpAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-olive-200 bg-white/70 px-6 py-8 text-center">
        <CheckCircle2 className="size-8 text-olive-600" aria-hidden />
        <p className="font-heading text-lg text-ink">{copy.invitation.rsvpThanks}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-olive-200 bg-white/80 p-5 text-left">
      <input type="hidden" name="slug" value={slug} />
      {state?.error ? (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="rsvp-name" className="text-sm font-medium text-ink">
          Nama
        </label>
        <input
          id="rsvp-name"
          name="name"
          required
          maxLength={120}
          className={fieldClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">
          {copy.invitation.rsvpTitle}
        </legend>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="radio" name="attendance" value="attending" defaultChecked />
          {copy.invitation.attending}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="radio" name="attendance" value="not_attending" />
          {copy.invitation.notAttending}
        </label>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="rsvp-guests" className="text-sm font-medium text-ink">
          {copy.invitation.guests}
        </label>
        <input
          id="rsvp-guests"
          name="guests"
          type="number"
          min={1}
          max={10}
          defaultValue={1}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rsvp-message" className="text-sm font-medium text-ink">
          {copy.invitation.message}
        </label>
        <textarea
          id="rsvp-message"
          name="message"
          rows={3}
          maxLength={1000}
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? copy.form.saving : copy.form.save}
      </button>
    </form>
  );
}
