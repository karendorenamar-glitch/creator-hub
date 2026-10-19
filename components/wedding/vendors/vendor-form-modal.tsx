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
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  vendor: Vendor | null;
  locale: "en" | "id";
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.category} htmlFor="vendor-category">
            <select
              id="vendor-category"
              name="category"
              defaultValue={vendor?.category ?? "other"}
              className={inputClass}
            >
              {Object.keys(labelGroups.vendorCategory).map((value) => (
                <option key={value} value={value}>
                  {label("vendorCategory", value, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.vendors.bookingStatus} htmlFor="vendor-booking">
            <select
              id="vendor-booking"
              name="bookingStatus"
              defaultValue={vendor?.booking_status ?? "considering"}
              className={inputClass}
            >
              {Object.keys(labelGroups.bookingStatus).map((value) => (
                <option key={value} value={value}>
                  {label("bookingStatus", value, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`${copy.vendors.contactName} (${copy.form.optional})`}
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
            label={`${copy.vendors.phone} (${copy.form.optional})`}
            htmlFor="vendor-phone"
          >
            <input
              id="vendor-phone"
              name="phone"
              maxLength={40}
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
          <Field
            label={`${copy.vendors.website} (${copy.form.optional})`}
            htmlFor="vendor-website"
          >
            <input
              id="vendor-website"
              name="website"
              placeholder="https://"
              maxLength={500}
              defaultValue={vendor?.website ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${copy.vendors.quoted} (IDR)`} htmlFor="vendor-quoted">
            <input
              id="vendor-quoted"
              name="quotedPrice"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={vendor?.quoted_price ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={`${copy.vendors.agreed} (IDR)`} htmlFor="vendor-agreed">
            <input
              id="vendor-agreed"
              name="agreedPrice"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={vendor?.agreed_price ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={`${copy.vendors.deposit} (IDR)`} htmlFor="vendor-deposit">
            <input
              id="vendor-deposit"
              name="depositAmount"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={vendor?.deposit_amount ?? 0}
              className={inputClass}
            />
          </Field>
          <Field label={`${copy.vendors.paid} (IDR)`} htmlFor="vendor-paid">
            <input
              id="vendor-paid"
              name="amountPaid"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              defaultValue={vendor?.amount_paid ?? 0}
              className={inputClass}
            />
          </Field>
          <Field label={copy.vendors.bookingDate} htmlFor="vendor-booking-date">
            <input
              id="vendor-booking-date"
              name="bookingDate"
              type="date"
              defaultValue={vendor?.booking_date ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={copy.vendors.serviceDate} htmlFor="vendor-service-date">
            <input
              id="vendor-service-date"
              name="serviceDate"
              type="date"
              defaultValue={vendor?.event_service_date ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={copy.vendors.nextPayment} htmlFor="vendor-next-payment">
            <input
              id="vendor-next-payment"
              name="nextPaymentDue"
              type="date"
              defaultValue={vendor?.next_payment_due ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label={`${copy.vendors.contractNotes} (${copy.form.optional})`}
          htmlFor="vendor-contract"
        >
          <textarea
            id="vendor-contract"
            name="contractNotes"
            rows={2}
            maxLength={4000}
            defaultValue={vendor?.contract_notes ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.vendors.notes} (${copy.form.optional})`}
          htmlFor="vendor-notes"
        >
          <textarea
            id="vendor-notes"
            name="notes"
            rows={2}
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
