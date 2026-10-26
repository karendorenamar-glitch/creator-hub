"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createInspirationAction,
  updateInspirationAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { FormModal } from "@/components/wedding/form-modal";
import { InspirationPhotoManager } from "@/components/wedding/inspiration/inspiration-photo-manager";
import { InspirationVendorOptions } from "@/components/wedding/inspiration/inspiration-vendor-options";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type {
  InspirationItem,
  InspirationVendorOption,
} from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { compressInspirationImage } from "@/lib/wedding/image-compress";
import { validateInspirationImageFile } from "@/lib/wedding/uploads";

const fileClass =
  "block w-full cursor-pointer rounded-2xl border border-dashed border-olive-200 bg-olive-50/35 px-4 py-5 text-sm text-ink-soft transition-colors hover:border-olive-300 hover:bg-olive-50/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-olive-700";

export function InspirationFormModal({
  open,
  onClose,
  copy,
  item,
  photos,
  categories,
  options,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  item: InspirationItem | null;
  photos: { id: string; url: string }[];
  categories: string[];
  options: InspirationVendorOption[];
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
      <div className="space-y-5">
        <FormAlert error={state?.error ?? fileError ?? undefined} />

        {item ? (
          <InspirationPhotoManager
            itemId={item.id}
            photos={photos}
            copy={copy}
          />
        ) : null}

        <form
          action={formAction}
          onSubmit={(event) => {
            if (fileError) event.preventDefault();
          }}
          className="space-y-5"
        >
          {item ? <input type="hidden" name="id" value={item.id} /> : null}

          <section className="space-y-4 rounded-2xl border border-petal-100/80 bg-white/80 p-4 sm:p-5">
            <div>
              <h3 className="font-heading text-base text-ink">
                {copy.inspiration.detailsSection}
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

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
                rows={3}
                maxLength={2000}
                defaultValue={item?.notes ?? ""}
                className={inputClass}
              />
            </Field>
          </section>

          <section className="space-y-3 rounded-2xl border border-petal-100/80 bg-white/80 p-4 sm:p-5">
            <div>
              <h3 className="font-heading text-base text-ink">
                {copy.inspiration.photoSection}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {copy.inspiration.uploadHint}
              </p>
            </div>

            <Field label={copy.inspiration.uploadLabel} htmlFor="inspiration-photo">
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
                    // Keep the original if this browser cannot replace a FileList.
                  }

                  setFileError(null);
                  const objectUrl = URL.createObjectURL(compressed);
                  setPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return objectUrl;
                  });
                }}
              />
            </Field>

            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-olive-100 bg-olive-50/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={copy.inspiration.uploadLabel}
                  className="max-h-56 w-full object-contain"
                />
              </div>
            ) : null}
          </section>

          <ModalFooter
            pending={pending}
            submitLabel={copy.form.save}
            savingLabel={copy.form.saving}
            cancelLabel={copy.form.cancel}
            onCancel={onClose}
          />
        </form>

        {item ? (
          <div className="rounded-2xl border border-petal-100/80 bg-white/80 p-4 sm:p-5">
            <InspirationVendorOptions
              itemId={item.id}
              options={options}
              copy={copy}
            />
          </div>
        ) : null}
      </div>
    </FormModal>
  );
}
