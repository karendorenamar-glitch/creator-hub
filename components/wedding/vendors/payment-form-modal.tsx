"use client";

import { useActionState, useEffect } from "react";
import { addVendorPaymentAction } from "@/app/wedding/(app)/vendors/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function PaymentFormModal({
  open,
  onClose,
  copy,
  vendorId,
  vendorName,
  suggestedAmount,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  vendorId: string | null;
  vendorName: string;
  suggestedAmount: number;
}) {
  const [state, formAction, pending] = useActionState(
    addVendorPaymentAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal open={open} onClose={onClose} title={copy.vendors.pay}>
      <form action={formAction} className="space-y-4">
        <p className="text-sm text-ink-soft">{vendorName}</p>
        {vendorId ? (
          <input type="hidden" name="vendorId" value={vendorId} />
        ) : null}
        <FormAlert error={state?.error} />

        <Field label={copy.vendors.paymentAmount} htmlFor="payment-amount">
          <input
            id="payment-amount"
            name="amount"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            required
            defaultValue={suggestedAmount > 0 ? suggestedAmount : ""}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.paymentDate} htmlFor="payment-date">
            <input
              id="payment-date"
              name="paidOn"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </Field>
          <Field
            label={`${copy.vendors.paymentMethod} (${copy.form.optional})`}
            htmlFor="payment-method"
          >
            <input
              id="payment-method"
              name="method"
              maxLength={60}
              placeholder="Transfer, tunai..."
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label={`${copy.vendors.paymentNotes} (${copy.form.optional})`}
          htmlFor="payment-notes"
        >
          <textarea
            id="payment-notes"
            name="notes"
            rows={2}
            maxLength={1000}
            className={inputClass}
          />
        </Field>

        <Field
          label={copy.vendors.proofLabel}
          htmlFor="payment-proof"
          hint={copy.vendors.proofHint}
        >
          <input
            id="payment-proof"
            name="proof"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-olive-700"
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
