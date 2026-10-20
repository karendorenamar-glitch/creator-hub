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
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const CATEGORY_SUGGESTIONS = [
  "Dekorasi",
  "Attire",
  "MUA",
  "Hair do",
  "Wedding ring",
];

const fileClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-olive-700";

export function InspirationFormModal({
  open,
  onClose,
  copy,
  item,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  item: InspirationItem | null;
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
            placeholder="Dekorasi akad"
            defaultValue={item?.title ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={copy.inspiration.category}
          htmlFor="inspiration-category"
          hint={copy.inspiration.categoryHint}
        >
          <input
            id="inspiration-category"
            name="category"
            list="inspiration-category-suggestions"
            maxLength={80}
            placeholder="Dekorasi"
            defaultValue={item?.category ?? ""}
            className={inputClass}
          />
          <datalist id="inspiration-category-suggestions">
            {CATEGORY_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </Field>

        <Field
          label={copy.inspiration.uploadLabel}
          htmlFor="inspiration-photo"
          hint={copy.inspiration.uploadHint}
        >
          <input
            id="inspiration-photo"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={fileClass}
          />
          {item?.image_path ? (
            <p className="text-xs text-ink-soft">
              {item.title} · {copy.form.saved}
            </p>
          ) : null}
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
