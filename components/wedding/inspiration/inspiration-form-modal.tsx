"use client";

import { useActionState, useEffect } from "react";
import {
  createInspirationAction,
  updateInspirationAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { InspirationItem } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function InspirationFormModal({
  open,
  onClose,
  copy,
  item,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  item: InspirationItem | null;
  locale: "en" | "id";
}) {
  const action = item ? updateInspirationAction : createInspirationAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={item ? copy.inspiration.edit : copy.inspiration.add}
    >
      <form action={formAction} className="space-y-4">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.inspiration.titleLabel} htmlFor="inspiration-title">
          <input
            id="inspiration-title"
            name="title"
            required
            maxLength={120}
            defaultValue={item?.title ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label={copy.inspiration.category} htmlFor="inspiration-category">
          <select
            id="inspiration-category"
            name="category"
            defaultValue={item?.category ?? "other"}
            className={inputClass}
          >
            {Object.keys(labelGroups.inspirationCategory).map((value) => (
              <option key={value} value={value}>
                {label("inspirationCategory", value, locale)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={`${copy.inspiration.imageUrl} (${copy.form.optional})`}
          htmlFor="inspiration-image"
          hint={copy.inspiration.imageHint}
        >
          <input
            id="inspiration-image"
            name="imageUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={1000}
            defaultValue={item?.image_url ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.inspiration.linkUrl} (${copy.form.optional})`}
          htmlFor="inspiration-link"
          hint={copy.inspiration.linkHint}
        >
          <input
            id="inspiration-link"
            name="linkUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={1000}
            defaultValue={item?.link_url ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.checklist.description} (${copy.form.optional})`}
          htmlFor="inspiration-description"
        >
          <textarea
            id="inspiration-description"
            name="description"
            rows={2}
            maxLength={2000}
            defaultValue={item?.description ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.inspiration.notes} (${copy.form.optional})`}
          htmlFor="inspiration-notes"
        >
          <textarea
            id="inspiration-notes"
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={item?.notes ?? ""}
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
