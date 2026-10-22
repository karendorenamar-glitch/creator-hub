"use client";

import { useActionState, useEffect } from "react";
import {
  createVendorGroupAction,
  updateVendorGroupAction,
} from "@/app/wedding/(app)/vendors/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { VendorGroup } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const SUGGESTIONS = [
  "Venue",
  "Catering",
  "Dekorasi",
  "MUA",
  "Fotografi",
  "Videografi",
  "Busana",
  "Entertainment",
  "Wedding Organizer",
  "Undangan",
  "Souvenir",
];

export function GroupFormModal({
  open,
  editing,
  copy,
  locale,
  picOptions,
  onClose,
}: {
  open: boolean;
  editing: VendorGroup | null;
  copy: ModuleCopy;
  locale: "en" | "id";
  picOptions: string[];
  onClose: () => void;
}) {
  const action = editing ? updateVendorGroupAction : createVendorGroupAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? copy.vendors.edit : copy.vendors.addGroup}
    >
      <form action={formAction} className="space-y-4">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.vendors.groupName} htmlFor="group-category">
          <input
            id="group-category"
            name="category"
            list="group-category-suggestions"
            maxLength={80}
            placeholder="MUA, Dekorasi, Venue..."
            defaultValue={editing?.category ?? ""}
            className={inputClass}
          />
          <datalist id="group-category-suggestions">
            {SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </Field>

        <Field label={`${copy.vendors.name} (${copy.form.optional})`} htmlFor="group-name">
          <input
            id="group-name"
            name="name"
            maxLength={120}
            defaultValue={editing?.name ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label={copy.vendors.picInternal} htmlFor="group-pic">
          <select
            id="group-pic"
            name="picInternal"
            defaultValue={editing?.pic_internal ?? ""}
            className={inputClass}
          >
            <option value="">{copy.vendors.picInternalPlaceholder}</option>
            {picOptions.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={`${copy.vendors.groupNotes} (${copy.form.optional})`}
          htmlFor="group-notes"
        >
          <textarea
            id="group-notes"
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={editing?.notes ?? ""}
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

export function unusedLocale(locale: "en" | "id") {
  return locale;
}