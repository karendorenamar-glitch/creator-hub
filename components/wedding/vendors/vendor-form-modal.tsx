"use client";

import { useActionState, useEffect } from "react";
import {
  createVendorAction,
  updateVendorAction,
} from "@/app/wedding/(app)/vendors/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import type { BudgetVendor } from "@/lib/wedding/budget-calc";

const CATEGORY_SUGGESTIONS = [
  "Venue",
  "Dekorasi",
  "Catering",
  "MUA",
  "Fotografi",
  "Busana",
  "Undangan",
  "Entertainment",
  "Souvenir",
  "Lainnya",
];

export function VendorFormModal({
  open,
  onClose,
  copy,
  vendor,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  vendor: BudgetVendor | null;
}) {
  const action = vendor ? updateVendorAction : createVendorAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={vendor ? copy.vendors.edit : copy.vendors.add}
    >
      <form action={formAction} className="space-y-4">
        {vendor ? <input type="hidden" name="id" value={vendor.id} /> : null}
        <FormAlert error={state?.error} />

        <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {copy.vendors.confirmedHint}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.name} htmlFor="vendor-name">
            <input
              id="vendor-name"
              name="name"
              required
              maxLength={120}
              defaultValue={vendor?.name ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label={copy.vendors.category} htmlFor="vendor-category">
            <input
              id="vendor-category"
              name="category"
              list="vendor-category-suggestions"
              maxLength={80}
              placeholder="Venue, Catering, MUA..."
              defaultValue={vendor?.category ?? ""}
              className={inputClass}
            />
            <datalist id="vendor-category-suggestions">
              {CATEGORY_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>

          <Field label={copy.vendors.picVendor} htmlFor="vendor-contact">
            <input
              id="vendor-contact"
              name="contactName"
              maxLength={120}
              defaultValue={vendor?.contact_name ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label={copy.vendors.picPhone} htmlFor="vendor-phone">
            <input
              id="vendor-phone"
              name="phone"
              maxLength={40}
              inputMode="tel"
              defaultValue={vendor?.phone ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label={`${copy.vendors.agreedPrice} (IDR)`}
            htmlFor="vendor-agreed-price"
          >
            <input
              id="vendor-agreed-price"
              name="agreedPrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              required
              defaultValue={vendor?.agreed_price ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={copy.vendors.notes} htmlFor="vendor-notes">
          <textarea
            id="vendor-notes"
            name="notes"
            rows={3}
            maxLength={4000}
            defaultValue={vendor?.notes ?? ""}
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
