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
import { compressInspirationImage } from "@/lib/wedding/image-compress";
import { validateInspirationImageFile } from "@/lib/wedding/uploads";

const fileClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-olive-700";

export function InspirationFormModal({
  open,
  onClose,
  copy,
  item,
  photos,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  item: InspirationItem | null;
  photos: { id: string; url: string }[];
  categories: string[];
}) {
  const action = item ? updateInspirationAction : createInspirationAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={item ? copy.inspiration.edit : copy.inspiration.add}
    >
      <div className="space-y-4">
        {item ? (
          <InspirationPhotoManager
            itemId={item?.id ?? null}
            photos={photos}
            copy={copy}
          />
        ) : null}

        <form
          action={formAction}
          onSubmit={(event) => {
            if (fileError) event.preventDefault();
          }}
          className="space-y-4"
        >
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
          <select
            id="inspiration-category"
            name="category"
            defaultValue={item?.category ?? ""}
            className={inputClass}
          >
            <option value="">{copy.form.none}</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
            accept="image/jpeg,image/png"
            className={fileClass}
            onChange={async (event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (!file) {
                setPreviewUrl(null);
                return;
              }
              const validation = validateInspirationImageFile(file);
              if (!validation.ok) {
                setFileError(
                  validation.error === "too_large"
                    ? copy.inspiration.imageTooLarge
                    : copy.inspiration.imageInvalidType,
                );
                setPreviewUrl(null);
                input.value = "";
                return;
              }

              const compressed = await compressInspirationImage(file);
              const finalCheck = validateInspirationImageFile(compressed);
              if (!finalCheck.ok) {
                setFileError(copy.inspiration.imageTooLarge);
                setPreviewUrl(null);
                input.value = "";
                return;
              }

              try {
                const transfer = new DataTransfer();
                transfer.items.add(compressed);
                input.files = transfer.files;
              } catch {
                // The original file remains selected if the browser cannot
                // replace an input's FileList; server validation still applies.
              }

              setFileError(null);
              const objectUrl = URL.createObjectURL(compressed);
              setPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return objectUrl;
              });
            }}
          />
          {previewUrl ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-olive-100 bg-olive-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={copy.inspiration.uploadLabel}
                className="max-h-48 w-full object-contain"
              />
            </div>
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
