"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Sparkles } from "lucide-react";
import {
  createInspirationVendorOptionAction,
  deleteInspirationVendorOptionAction,
  updateInspirationVendorOptionAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { InspirationVendorOption } from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { isHttpUrl } from "@/lib/wedding/validation";

function OptionFormModal({
  open,
  onClose,
  copy,
  itemId,
  option,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  itemId: string;
  option: InspirationVendorOption | null;
}) {
  const action = option
    ? updateInspirationVendorOptionAction
    : createInspirationVendorOptionAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        option
          ? copy.inspiration.editVendorOption
          : copy.inspiration.addVendorOption
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="itemId" value={itemId} />
        {option ? <input type="hidden" name="id" value={option.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.inspiration.vendorName} htmlFor="option-name">
          <input
            id="option-name"
            name="vendorName"
            maxLength={120}
            defaultValue={option?.vendor_name ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.inspiration.instagramUrl} (${copy.form.optional})`}
          htmlFor="option-instagram"
        >
          <input
            id="option-instagram"
            name="instagramUrl"
            type="url"
            inputMode="url"
            placeholder="https://instagram.com/..."
            maxLength={1000}
            defaultValue={option?.instagram_url ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.inspiration.referencePrice} (${copy.form.optional})`}
          htmlFor="option-price"
        >
          <input
            id="option-price"
            name="referencePrice"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={option?.reference_price ?? ""}
            className={inputClass}
          />
        </Field>

        <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs text-ink-soft">
          {copy.inspiration.referenceOnly}
        </p>

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

export function InspirationVendorOptions({
  itemId,
  options,
  copy,
}: {
  itemId: string;
  options: InspirationVendorOption[];
  copy: ModuleCopy;
}) {
  const [modal, setModal] = useState<{
    open: boolean;
    editing: InspirationVendorOption | null;
  }>({ open: false, editing: null });

  return (
    <div className="space-y-3 border-t border-petal-100/80 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base text-ink">
            <Sparkles className="size-4 text-champagne" aria-hidden />
            {copy.inspiration.vendorOptions}
          </h3>
          {options.length > 0 ? (
            <p className="mt-1 text-xs text-ink-soft">
              {options.length} {copy.inspiration.vendorOptions.toLowerCase()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setModal({ open: true, editing: null })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-olive-200 bg-white px-3 py-2 text-xs font-medium text-olive-700 transition-colors hover:bg-olive-50"
        >
          <Plus className="size-3.5" aria-hidden />
          {copy.inspiration.addVendorOption}
        </button>
      </div>

      {options.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-petal-200 bg-petal-50/35 px-4 py-5 text-center">
          <p className="text-sm text-ink-soft">{copy.inspiration.noVendorOptions}</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option, optionIndex) => {
            const displayName = option.vendor_name.trim();
            const unnamed =
              !displayName ||
              displayName === copy.inspiration.untitledVendorOption;
            const instagram = option.instagram_url && isHttpUrl(option.instagram_url)
              ? option.instagram_url
              : null;

            return (
              <article
                key={option.id}
                className="rounded-2xl border border-petal-100/80 bg-cream/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                      {copy.inspiration.untitledVendorOption} {optionIndex + 1}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-ink">
                      {unnamed ? copy.inspiration.noReferencePrice : displayName}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, editing: option })}
                      aria-label={copy.form.edit}
                      className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    <DeleteForm
                      action={deleteInspirationVendorOptionAction}
                      id={option.id}
                      copy={copy}
                    />
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
                  <span className="rounded-full border border-petal-100 bg-white/70 px-2 py-1">
                    {copy.inspiration.referencePrice}:{" "}
                    <span className="font-medium text-ink">
                      {option.reference_price !== null
                        ? formatIDR(option.reference_price)
                        : copy.inspiration.noReferencePrice}
                    </span>
                  </span>
                  {instagram ? (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-olive-100 bg-white/70 px-2 py-1 text-olive-700 hover:border-olive-200 hover:underline"
                    >
                      <ExternalLink className="size-3" aria-hidden />
                      Instagram
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-ink-soft">
        {copy.inspiration.referenceOnly}
      </p>

      <OptionFormModal
        key={modal.editing?.id ?? "new-option"}
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        copy={copy}
        itemId={itemId}
        option={modal.editing}
      />
    </div>
  );
}
