"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createVendorAction,
  resetVendorStatusAction,
  updateVendorAction,
} from "@/app/wedding/(app)/vendors/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { PaymentStatusBadge } from "@/components/wedding/vendors/payment-status-badge";
import { VendorPaymentSection } from "@/components/wedding/vendors/vendor-payment-section";
import type {
  BudgetVendor,
  VendorPaymentSummary,
} from "@/lib/wedding/budget-calc";
import type {
  VendorPayment,
  VendorPaymentProof,
} from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { PAYMENT_PROOF_TYPES } from "@/lib/wedding/uploads";
import type { VendorOptionPrefill } from "@/lib/wedding/vendor-options";

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
  locale,
  vendor,
  payments,
  proofsByPayment,
  proofUrls,
  summary,
  idempotencyKey,
  prefill,
  onPaymentSaved,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  locale: "en" | "id";
  vendor: BudgetVendor | null;
  payments: VendorPayment[];
  proofsByPayment: Record<string, VendorPaymentProof[]>;
  proofUrls: Record<string, string>;
  summary?: VendorPaymentSummary;
  idempotencyKey: string;
  prefill?: VendorOptionPrefill | null;
  onPaymentSaved: () => void;
}) {
  const action = vendor ? updateVendorAction : createVendorAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [price, setPrice] = useState(
    vendor?.agreed_price !== null && vendor?.agreed_price !== undefined
      ? String(vendor.agreed_price)
      : prefill?.referencePrice !== null &&
          prefill?.referencePrice !== undefined
        ? String(prefill.referencePrice)
        : "",
  );
  const [completed, setCompleted] = useState(
    Boolean(vendor?.collaboration_completed_at),
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [initialKind, setInitialKind] = useState<
    "dp" | "lanjutan" | "pelunasan"
  >("dp");
  const [initialAmount, setInitialAmount] = useState("");
  const [statusIntent, setStatusIntent] = useState<
    "diskusi" | "dp" | "termin_lanjutan" | "lunas" | "donor"
  >("diskusi");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    // Always close after a successful save. Keeping the portal open used to
    // leave the page behind an invisible blocking overlay, making the whole app
    // feel unresponsive after saving an existing vendor.
    if (state?.success) onClose();
  }, [state, onClose]);

  const zeroPrice = price !== "" && Number(price) === 0;

  async function resetToDiscussion() {
    if (!vendor || resetBusy) return;
    if (!window.confirm(copy.vendors.resetStatusConfirm)) return;
    setResetBusy(true);
    setResetError(null);
    try {
      const formData = new FormData();
      formData.set("id", vendor.id);
      const result = await resetVendorStatusAction(formData);
      if (result?.error) setResetError(result.error);
      else onClose();
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={vendor ? copy.vendors.edit : copy.vendors.add}
    >
      <form action={formAction} className="space-y-4">
        {vendor ? <input type="hidden" name="id" value={vendor.id} /> : null}
        {!vendor && prefill ? (
          <input type="hidden" name="vendorOptionId" value={prefill.optionId} />
        ) : null}
        <FormAlert error={state?.error} />
        {state?.success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {state.success}
          </p>
        ) : null}

        <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {copy.vendors.confirmedHint}
        </p>
        {!vendor && prefill ? (
          <p className="rounded-xl border border-petal-100 bg-petal-50/50 px-3 py-2 text-xs leading-relaxed text-rosewood">
            {copy.vendors.optionPrefilledHint}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.name} htmlFor="vendor-name">
            <input
              id="vendor-name"
              name="name"
              required
              maxLength={120}
              defaultValue={vendor?.name ?? prefill?.name ?? ""}
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
              defaultValue={vendor?.category ?? prefill?.category ?? ""}
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

          {!vendor ? (
            <Field
              label={copy.vendors.paymentStatus}
              htmlFor="vendor-payment-status-intent"
              hint={copy.vendors.statusIntentHint}
            >
              <select
                id="vendor-payment-status-intent"
                name="paymentStatusIntent"
                value={statusIntent}
                onChange={(event) => {
                  const next = event.target.value as typeof statusIntent;
                  setStatusIntent(next);
                  setInitialKind(
                    next === "termin_lanjutan"
                      ? "lanjutan"
                      : next === "lunas"
                        ? "pelunasan"
                        : "dp",
                  );
                }}
                className={inputClass}
              >
                <option value="diskusi">{copy.vendors.statusDiskusi}</option>
                <option value="dp">{copy.vendors.statusDp}</option>
                <option value="termin_lanjutan">
                  {copy.vendors.statusTerminLanjutan}
                </option>
                <option value="lunas">{copy.vendors.statusLunas}</option>
                <option value="donor">{copy.vendors.statusDonor}</option>
              </select>
            </Field>
          ) : vendor && summary ? (
            <Field
              label={copy.vendors.paymentStatus}
              htmlFor="vendor-payment-status"
            >
              <div id="vendor-payment-status" className="space-y-2 pt-1">
                <PaymentStatusBadge
                  status={summary.paymentStatus}
                  copy={copy}
                />
                <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft">
                  {copy.vendors.fundingSource}
                </span>
                <select
                  name="fundingSource"
                  defaultValue={
                    vendor.funded_by_donor ? "donor" : "cash"
                  }
                  className={inputClass}
                  aria-label={copy.vendors.fundingSource}
                >
                  <option value="cash">{copy.vendors.fundingCash}</option>
                  <option value="donor">{copy.vendors.fundingDonor}</option>
                </select>
                {summary.paymentStatus !== "diskusi" ? (
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => void resetToDiscussion()}
                    className="block text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
                  >
                    {resetBusy
                      ? copy.form.saving
                      : copy.vendors.resetStatus}
                  </button>
                ) : null}
                {resetError ? (
                  <p className="text-xs text-rose-600">{resetError}</p>
                ) : null}
              </div>
            </Field>
          ) : null}

          <Field
            label={`${copy.vendors.agreedPrice} (IDR)`}
            htmlFor="vendor-agreed-price"
            hint={copy.vendors.agreedPriceHint}
          >
            <input
              id="vendor-agreed-price"
              name="agreedPrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={inputClass}
            />
          </Field>

        </div>

        {zeroPrice ? (
          <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
            <input
              type="checkbox"
              name="collaborationCompleted"
              value="yes"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
              className="mt-0.5 size-4"
            />
            <span>
              <span className="font-medium">{copy.vendors.markCompleted}</span>
              <span className="mt-0.5 block text-amber-800">
                {copy.vendors.markCompletedHint}
              </span>
            </span>
          </label>
        ) : null}

        {!vendor && statusIntent !== "diskusi" && statusIntent !== "donor" ? (
          <div className="space-y-3 rounded-2xl border border-olive-100 bg-olive-50/40 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
                {copy.vendors.initialPayment}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {copy.vendors.initialPaymentHint}
              </p>
            </div>

            <input
              type="hidden"
              name="idempotencyKey"
              value={idempotencyKey}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={copy.vendors.paymentKind}
                htmlFor="vendor-initial-kind"
              >
                <select
                  id="vendor-initial-kind"
                  name="paymentKind"
                  value={initialKind}
                  onChange={(event) =>
                    setInitialKind(event.target.value as typeof initialKind)
                  }
                  className={inputClass}
                >
                  {Object.keys(labelGroups.paymentKind).map((value) => (
                    <option key={value} value={value}>
                      {label("paymentKind", value, locale)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={`${copy.vendors.paymentAmount} (${copy.form.optional})`}
                htmlFor="vendor-initial-amount"
              >
                <input
                  id="vendor-initial-amount"
                  name="paymentAmount"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  required={!(price === "0" && completed && statusIntent === "lunas")}
                  value={initialAmount}
                  onChange={(event) => setInitialAmount(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field
                label={copy.vendors.paymentDate}
                htmlFor="vendor-initial-date"
              >
                <input
                  id="vendor-initial-date"
                  name="paidOn"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={inputClass}
                />
              </Field>

              <Field
                label={`${copy.vendors.paymentNotes} (${copy.form.optional})`}
                htmlFor="vendor-initial-notes"
              >
                <input
                  id="vendor-initial-notes"
                  name="paymentNotes"
                  maxLength={1000}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label={`${copy.vendors.proofLabel} (${copy.form.optional})`}
              htmlFor="vendor-initial-proof"
              hint={copy.vendors.proofHint}
            >
              <input
                id="vendor-initial-proof"
                name="proof"
                type="file"
                multiple
                accept={PAYMENT_PROOF_TYPES.join(",")}
                className="w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:text-olive-700"
              />
            </Field>
          </div>
        ) : null}

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

      {vendor && summary ? (
        <div className="mt-4 border-t border-olive-100 pt-4">
          <VendorPaymentSection
            vendor={vendor}
            payments={payments}
            proofsByPayment={proofsByPayment}
            proofUrls={proofUrls}
            summary={summary}
            copy={copy}
            locale={locale}
            idempotencyKey={idempotencyKey}
            showForm={showPaymentForm}
            onRequestPayment={() => setShowPaymentForm(true)}
            onCancelPayment={() => setShowPaymentForm(false)}
            onSaved={onPaymentSaved}
          />
        </div>
      ) : null}
    </FormModal>
  );
}
