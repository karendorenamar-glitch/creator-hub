"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import {
  createInspirationVendorOptionAction,
  deleteInspirationVendorOptionAction,
  updateInspirationVendorOptionAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { FormModal } from "@/components/wedding/form-modal";
import {
  AddButton,
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { Badge } from "@/components/wedding/ui";
import type { InspirationVendorOption } from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

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
    <div className="space-y-2 border-t border-olive-100 pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
          {copy.inspiration.vendorOptions}
        </p>
        <AddButton
          label={copy.inspiration.addVendorOption}
          onClick={() => setModal({ open: true, editing: null })}
        />
      </div>

      {options.length === 0 ? (
        <p className="text-xs text-ink-soft">
          {copy.inspiration.noVendorOptions}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {options.map((option, optionIndex) => {
            const displayName = option.vendor_name.trim();
            const unnamed =
              !displayName ||
              displayName === copy.inspiration.untitledVendorOption;
            return (
            <li
              key={option.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-olive-50/50 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-ink">
                  <span className="mr-1 text-ink-soft">
                    {copy.inspiration.untitledVendorOption} {optionIndex + 1}:
                  </span>
                  {unnamed ? copy.inspiration.noReferencePrice : displayName}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                  <Badge tone="muted">
                    {copy.inspiration.referencePrice}:{" "}
                    {option.reference_price !== null
                      ? formatIDR(option.reference_price)
                      : copy.inspiration.noReferencePrice}
                  </Badge>
                  {option.instagram_url ? (
                    <a
                      href={option.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-olive-700 hover:underline"
                    >
                      <ExternalLink className="size-3" aria-hidden />
                      Instagram
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setModal({ open: true, editing: option })}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-soft hover:bg-olive-50"
                >
                  <Pencil className="size-3" aria-hidden />
                  {copy.form.edit}
                </button>
                <DeleteForm
                  action={deleteInspirationVendorOptionAction}
                  id={option.id}
                  copy={copy}
                />
              </div>
            </li>
            );
          })}
        </ul>
      )}

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

