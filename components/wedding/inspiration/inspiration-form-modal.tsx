"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createInspirationAction,
  updateInspirationAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { FormModal } from "@/components/wedding/form-modal";
import { InspirationPhotoManager } from "@/components/wedding/inspiration/inspiration-photo-manager";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { InspirationItem } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { validateInspirationImageFile } from "@/lib/wedding/uploads";

const CATEGORY_SUGGESTIONS = [
  "Venue",
  "Dekorasi",
  "Catering",
  "MUA",
  "Fotografer",
  "Busana",
  "Undangan",
  "Lainnya",
];

const fileClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-olive-700";

export function InspirationFormModal({
  open,
  onClose,
  copy,
  item,
  photos,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  item: InspirationItem | null;
  photos: { id: string; url: string }[];
}) {
  const action = item ? updateInspirationAction : createInspirationAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [fileError, setFileError] = useState<string | null>(null);

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
      <div className="space-y-4">
        {item ? (
          <InspirationPhotoManager photos={photos} copy={copy} />
        ) : null}

        <form action={formAction} className="space-y-4">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <FormAlert error={state?.error ?? fileError ?? undefined} />

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
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png"
            className={fileClass}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              const invalid = files
                .map((file) => validateInspirationImageFile(file))
                .find((result) => !result.ok);
              setFileError(
                invalid && !invalid.ok
                  ? invalid.error === "too_large"
                    ? copy.inspiration.imageTooLarge
                    : copy.inspiration.imageInvalidType
                  : null,
              );
            }}
          />
          {item?.image_path ? (
            <p className="text-xs text-ink-soft">
              {copy.inspiration.uploadHint}
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
      </div>
    </FormModal>
  );
}
