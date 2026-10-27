"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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

type GuestRow = {
  key: string;
  name: string;
  phone: string;
  plusOnes: string;
};

function newGuestRow(): GuestRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    phone: "",
    plusOnes: "0",
  };
}

export function GuestFormModal({
  open,
  onClose,
  copy,
  guest,
  locale,
  groups = [],
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  guest: Guest | null;
  locale: "en" | "id";
  groups?: string[];
}) {
  const action = guest ? updateGuestAction : createGuestAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();
  const refreshed = useRef(false);
  const initialSide =
    guest?.side === "bride" || guest?.side === "groom" ? guest.side : "";
  const needsSideAssignment =
    Boolean(guest) && (!guest?.side || guest.side === "unassigned");

  useEffect(() => {
    if (state?.success && !refreshed.current) {
      refreshed.current = true;
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  const [rows, setRows] = useState<GuestRow[]>(() =>
    guest
      ? [
          {
            key: guest.id,
            name: guest.name,
            phone: guest.phone ?? "",
            plusOnes: String(guest.plus_ones),
          },
        ]
      : [newGuestRow()],
  );

  function updateRow(key: string, patch: Partial<GuestRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => (current.length >= 50 ? current : [...current, newGuestRow()]));
  }

  function removeRow(key: string) {
    setRows((current) =>
      current.length <= 1 ? current : current.filter((row) => row.key !== key),
    );
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={guest ? copy.guests.edit : copy.guests.add}
    >
      <form action={formAction} className="space-y-4">
        {guest ? <input type="hidden" name="id" value={guest.id} /> : null}
        {guest ? (
          <input type="hidden" name="email" value={guest.email ?? ""} />
        ) : null}
        <FormAlert error={state?.error} />

        <Field
          label={copy.guests.side}
          htmlFor="guest-side"
          hint={
            needsSideAssignment ? copy.guests.sideUnassignedPrompt : undefined
          }
        >
          <select
            id="guest-side"
            name="side"
            required
            defaultValue={initialSide}
            className={inputClass}
          >
            <option value="" disabled>
              {copy.guests.sidePlaceholder}
            </option>
            <option value="bride">{copy.guests.brideSide}</option>
            <option value="groom">{copy.guests.groomSide}</option>
          </select>
        </Field>

        <Field
          label={`${copy.guests.group} (${copy.form.optional})`}
          htmlFor="guest-group"
          hint={copy.guests.groupHint}
        >
          <input
            id="guest-group"
            name="guestGroup"
            list="guest-group-options"
            maxLength={80}
            placeholder={copy.guests.groupPlaceholder}
            defaultValue={guest?.guest_group ?? ""}
            className={inputClass}
          />
          <datalist id="guest-group-options">
            {groups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </Field>

        <div className="space-y-3 rounded-2xl border border-olive-100 bg-olive-50/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">{copy.guests.people}</p>
            <span className="text-xs text-ink-soft">{rows.length}</span>
          </div>

          {rows.map((row, index) => (
            <div
              key={row.key}
              className="space-y-3 rounded-xl border border-olive-100 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-ink-soft">
                  {index + 1}
                </p>
                {!guest && rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {copy.guests.removeName}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={copy.guests.name}
                  htmlFor={`guest-name-${row.key}`}
                  className="sm:col-span-2"
                >
                  <input
                    id={`guest-name-${row.key}`}
                    name="name"
                    maxLength={120}
                    value={row.name}
                    onChange={(event) =>
                      updateRow(row.key, { name: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={`${copy.guests.phone} (${copy.form.optional})`}
                  htmlFor={`guest-phone-${row.key}`}
                >
                  <input
                    id={`guest-phone-${row.key}`}
                    name="phone"
                    maxLength={40}
                    value={row.phone}
                    onChange={(event) =>
                      updateRow(row.key, { phone: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={copy.guests.plusOnes}
                  htmlFor={`guest-plus-${row.key}`}
                  hint={copy.guests.plusOnesHint}
                >
                  <input
                    id={`guest-plus-${row.key}`}
                    name="plusOnes"
                    type="number"
                    min={0}
                    max={20}
                    value={row.plusOnes}
                    onChange={(event) =>
                      updateRow(row.key, { plusOnes: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}

          {!guest ? (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm font-medium text-olive-700 hover:bg-olive-50"
            >
              <Plus className="size-4" aria-hidden />
              {copy.guests.addName}
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
