"use client";

import { useActionState, useEffect, useState } from "react";
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
  const [status, setStatus] = useState(vendor?.payment_status ?? "diskusi");

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
            label={`${copy.vendors.name}`}
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
            label={`${copy.vendors.category}`}
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
            label={`${copy.vendors.picVendor}`}
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
            label={`${copy.vendors.picPhone}`}
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
            htmlFor="vendor-total"
          >
            <input
              id="vendor-total"
              name="agreedPrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={vendor?.agreed_price ?? vendor?.quoted_price ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.paymentStatus} htmlFor="vendor-status">
            <select
              id="vendor-status"
              name="paymentStatus"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
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

        {status !== "diskusi" ? (
          <div className="space-y-4 rounded-2xl border border-olive-200 bg-olive-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
              {copy.vendors.payments}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={copy.vendors.paymentAmount}
                htmlFor="vendor-paid-amount"
              >
                <input
                  id="vendor-paid-amount"
                  name="paidAmount"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  className={inputClass}
                />
              </Field>
              <Field
                label={copy.vendors.paymentDate}
                htmlFor="vendor-paid-on"
              >
                <input
                  id="vendor-paid-on"
                  name="paidOn"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field
              label={copy.vendors.proofLabel}
              htmlFor="vendor-proof"
              hint={copy.vendors.proofHint}
            >
              <input
                id="vendor-proof"
                name="proof"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-olive-700"
              />
            </Field>
          </div>
        ) : null}

        <Field
          label={`${copy.vendors.notes}`}
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
