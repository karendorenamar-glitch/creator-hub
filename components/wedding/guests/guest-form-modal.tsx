"use client";

import { useActionState, useEffect } from "react";
import { createGuestAction, updateGuestAction } from "@/app/wedding/(app)/guests/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { Guest } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function GuestFormModal({
  open,
  onClose,
  copy,
  guest,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  guest: Guest | null;
  locale: "en" | "id";
}) {
  const action = guest ? updateGuestAction : createGuestAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={guest ? copy.guests.edit : copy.guests.add}
    >
      <form action={formAction} className="space-y-4">
        {guest ? <input type="hidden" name="id" value={guest.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.guests.name} htmlFor="guest-name">
          <input
            id="guest-name"
            name="name"
            required
            maxLength={120}
            defaultValue={guest?.name ?? ""}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${copy.guests.phone} (${copy.form.optional})`} htmlFor="guest-phone">
            <input
              id="guest-phone"
              name="phone"
              maxLength={40}
              defaultValue={guest?.phone ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={`${copy.guests.email} (${copy.form.optional})`} htmlFor="guest-email">
            <input
              id="guest-email"
              name="email"
              type="email"
              maxLength={200}
              defaultValue={guest?.email ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={`${copy.guests.group} (${copy.form.optional})`} htmlFor="guest-group">
            <input
              id="guest-group"
              name="guestGroup"
              maxLength={80}
              placeholder={copy.guests.groupPlaceholder}
              defaultValue={guest?.guest_group ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={copy.guests.plusOnes} htmlFor="guest-plus">
            <input
              id="guest-plus"
              name="plusOnes"
              type="number"
              min={0}
              max={20}
              defaultValue={guest?.plus_ones ?? 0}
              className={inputClass}
            />
          </Field>
          <Field label={copy.guests.invitation} htmlFor="guest-invitation">
            <select
              id="guest-invitation"
              name="invitationStatus"
              defaultValue={guest?.invitation_status ?? "not_sent"}
              className={inputClass}
            >
              {Object.keys(labelGroups.invitationStatus).map((value) => (
                <option key={value} value={value}>
                  {label("invitationStatus", value, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.guests.rsvp} htmlFor="guest-rsvp">
            <select
              id="guest-rsvp"
              name="rsvpStatus"
              defaultValue={guest?.rsvp_status ?? "pending"}
              className={inputClass}
            >
              {Object.keys(labelGroups.rsvpStatus).map((value) => (
                <option key={value} value={value}>
                  {label("rsvpStatus", value, locale)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={`${copy.guests.notes} (${copy.form.optional})`} htmlFor="guest-notes">
          <textarea
            id="guest-notes"
            name="notes"
            rows={2}
            maxLength={1000}
            defaultValue={guest?.notes ?? ""}
            className={inputClass}
          />
        </Field>

        <ModalFooter
          pending={pending}
          submitLabel={copy.form.save}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}
