"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveInvitationAction } from "@/app/wedding/(app)/invitation/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import { ImageUploadField } from "@/components/wedding/invitation/image-upload-field";
import type { Invitation, InvitationContent } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function InvitationEditor({
  copy,
  invitation,
  defaultSlug,
  coverUrl,
  coupleUrl,
}: {
  copy: ModuleCopy;
  invitation: Invitation | null;
  defaultSlug: string;
  coverUrl: string | null;
  coupleUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveInvitationAction,
    null,
  );
  const content: InvitationContent = invitation?.content ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <FormAlert error={state?.error} success={state?.success} />

      <Field
        label={copy.invitation.slug}
        htmlFor="invitation-slug"
        hint={copy.invitation.slugHint}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-olive-50 px-2 py-2 text-sm text-ink-soft">
            /i/
          </span>
          <input
            id="invitation-slug"
            name="slug"
            required
            maxLength={60}
            defaultValue={invitation?.slug ?? defaultSlug}
            className={inputClass}
          />
        </div>
      </Field>

      <Field label={copy.invitation.tagline} htmlFor="invitation-tagline">
        <input
          id="invitation-tagline"
          name="tagline"
          maxLength={160}
          placeholder="The wedding of"
          defaultValue={content.tagline ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label={copy.invitation.story} htmlFor="invitation-story">
        <textarea
          id="invitation-story"
          name="story"
          rows={4}
          maxLength={4000}
          defaultValue={content.story ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={copy.invitation.ceremonyTime}
          htmlFor="invitation-ceremony-time"
        >
          <input
            id="invitation-ceremony-time"
            name="ceremonyTime"
            maxLength={120}
            placeholder="09.00 WIB"
            defaultValue={content.ceremonyTime ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label={copy.invitation.ceremonyPlace}
          htmlFor="invitation-ceremony-place"
        >
          <input
            id="invitation-ceremony-place"
            name="ceremonyPlace"
            maxLength={160}
            defaultValue={content.ceremonyPlace ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label={copy.invitation.receptionTime}
          htmlFor="invitation-reception-time"
        >
          <input
            id="invitation-reception-time"
            name="receptionTime"
            maxLength={120}
            placeholder="11.00 WIB"
            defaultValue={content.receptionTime ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label={copy.invitation.receptionPlace}
          htmlFor="invitation-reception-place"
        >
          <input
            id="invitation-reception-place"
            name="receptionPlace"
            maxLength={160}
            defaultValue={content.receptionPlace ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={copy.invitation.venueAddress} htmlFor="invitation-venue">
        <textarea
          id="invitation-venue"
          name="venueAddress"
          rows={2}
          maxLength={400}
          defaultValue={content.venueAddress ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.invitation.mapsUrl} htmlFor="invitation-maps">
          <input
            id="invitation-maps"
            name="mapsUrl"
            type="url"
            maxLength={1000}
            placeholder="https://maps.google.com/..."
            defaultValue={content.mapsUrl ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label={copy.invitation.dressCode} htmlFor="invitation-dress">
          <input
            id="invitation-dress"
            name="dressCode"
            maxLength={200}
            placeholder="Olive & cream"
            defaultValue={content.dressCode ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          field="cover"
          label={copy.invitation.coverImageUrl}
          currentUrl={coverUrl}
          copy={copy}
        />
        <ImageUploadField
          field="couple"
          label={copy.invitation.coupleImageUrl}
          currentUrl={coupleUrl}
          copy={copy}
        />
      </div>

      <Field label={copy.invitation.musicUrl} htmlFor="invitation-music">
        <input
          id="invitation-music"
          name="musicUrl"
          type="url"
          maxLength={1000}
          placeholder="https://.../song.mp3"
          defaultValue={content.musicUrl ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label={copy.invitation.closingMessage}
        htmlFor="invitation-closing"
      >
        <textarea
          id="invitation-closing"
          name="closingMessage"
          rows={3}
          maxLength={1000}
          defaultValue={content.closingMessage ?? ""}
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Save className="size-4" aria-hidden />
        )}
        {pending ? copy.form.saving : copy.form.save}
      </button>

    </form>
  );
}
