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
import type { Vendor } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function VendorFormModal({
  open,
  onClose,
  copy,
  vendor,
  locale,
  picOptions,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  vendor: Vendor | null;
  locale: "en" | "id";
  picOptions: string[];
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={`${copy.vendors.name} (${copy.form.optional})`}
            htmlFor="vendor-name"
          >
            <input
              id="vendor-name"
              name="name"
              maxLength={120}
              defaultValue={vendor?.name ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label={`${copy.vendors.category} (${copy.form.optional})`}
            htmlFor="vendor-category"
          >
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
              {[
                "Venue",
                "Catering",
                "Dekorasi",
                "MUA",
                "Wedding Organizer",
                "Fotografi",
                "Videografi",
                "Busana",
                "Undangan",
                "Entertainment",
                "Souvenir",
              ].map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>

          <Field
            label={`${copy.vendors.picVendor} (${copy.form.optional})`}
            htmlFor="vendor-contact"
          >
            <input
              id="vendor-contact"
              name="contactName"
              maxLength={120}
              defaultValue={vendor?.contact_name ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label={`${copy.vendors.picPhone} (${copy.form.optional})`}
            htmlFor="vendor-phone"
          >
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
            label={`${copy.vendors.email} (${copy.form.optional})`}
            htmlFor="vendor-email"
          >
            <input
              id="vendor-email"
              name="email"
              type="email"
              maxLength={200}
              defaultValue={vendor?.email ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label={copy.vendors.picInternal} htmlFor="vendor-pic-internal">
            <select
              id="vendor-pic-internal"
              name="picInternal"
              defaultValue={vendor?.pic_internal ?? ""}
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
            label={`${copy.vendors.estimate} (IDR)`}
            htmlFor="vendor-estimate"
          >
            <input
              id="vendor-estimate"
              name="quotedPrice"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={vendor?.quoted_price ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label={`${copy.vendors.actualBill} (IDR)`}
            htmlFor="vendor-bill"
          >
            <input
              id="vendor-bill"
              name="agreedPrice"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={vendor?.agreed_price ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.paymentStatus} htmlFor="vendor-status">
            <select
              id="vendor-status"
              name="paymentStatus"
              defaultValue={vendor?.payment_status ?? "diskusi"}
              className={inputClass}
            >
              {Object.keys(labelGroups.paymentStatus).map((value) => (
                <option key={value} value={value}>
                  {label("paymentStatus", value, locale)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label={`${copy.vendors.notes} (${copy.form.optional})`}
          htmlFor="vendor-notes"
        >
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
