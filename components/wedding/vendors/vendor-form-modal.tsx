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
import { formatIDR } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { PAYMENT_PROOF_TYPES } from "@/lib/wedding/uploads";

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
  onOpenHistory,
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
  onOpenHistory: () => void;
  onPaymentSaved: () => void;
}) {
  const action = vendor ? updateVendorAction : createVendorAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [price, setPrice] = useState(
    vendor?.agreed_price === null || vendor?.agreed_price === undefined
      ? ""
      : String(vendor.agreed_price),
  );
  const [completed, setCompleted] = useState(
    Boolean(vendor?.collaboration_completed_at),
  );
  const [showPaymentForm, setShowPaymentForm] = useState(
    summary?.paymentStatus === "dp" ||
      summary?.paymentStatus === "termin_lanjutan" ||
      summary?.paymentStatus === "lunas",
  );
  const [initialKind, setInitialKind] = useState<
    "dp" | "lanjutan" | "pelunasan"
  >("dp");
  const [initialAmount, setInitialAmount] = useState("");
  const [statusIntent, setStatusIntent] = useState<
    "diskusi" | "dp" | "termin_lanjutan" | "lunas"
  >("diskusi");

  useEffect(() => {
    // Keep an existing vendor editor open after saving details so the payment
    // section below remains usable in the same combined workflow.
    if (state?.success && !vendor) onClose();
  }, [state, onClose, vendor]);

  const zeroPrice = price !== "" && Number(price) === 0;

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
        {state?.success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {state.success}
          </p>
        ) : null}

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
              </select>
            </Field>
          ) : vendor && summary ? (
            <Field
              label={copy.vendors.paymentStatus}
              htmlFor="vendor-payment-status"
            >
              <div id="vendor-payment-status" className="pt-1">
                <PaymentStatusBadge
                  status={summary.paymentStatus}
                  copy={copy}
                />
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

        {!vendor && statusIntent !== "diskusi" ? (
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
        <div className="mt-4 space-y-4 border-t border-olive-100 pt-4">
          <div className="rounded-2xl border border-olive-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
                {copy.vendors.currentPaymentSummary}
              </p>
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <p className="flex justify-between gap-2">
                <span className="text-ink-soft">{copy.vendors.agreedPrice}</span>
                <span className="font-medium text-ink">
                  {price === ""
                    ? copy.vendors.priceUnknown
                    : formatIDR(Number(price))}
                </span>
              </p>
              <p className="flex justify-between gap-2">
                <span className="text-ink-soft">{copy.vendors.totalPaid}</span>
                <span className="font-medium text-ink">
                  {formatIDR(summary.totalPaid)}
                </span>
              </p>
              <p className="flex justify-between gap-2">
                <span className="text-ink-soft">
                  {copy.vendors.remainingPayment}
                </span>
                <span className="font-medium text-ink">
                  {price === ""
                    ? "—"
                    : formatIDR(summary.remainingPayment)}
                </span>
              </p>
              <p className="flex justify-between gap-2">
                <span className="text-ink-soft">
                  {copy.vendors.overpayment}
                </span>
                <span className="font-medium text-ink">
                  {price === ""
                    ? "—"
                    : formatIDR(summary.overpayment)}
                </span>
              </p>
            </div>
          </div>

          <VendorPaymentSection
            vendor={vendor}
            payments={payments}
            proofsByPayment={proofsByPayment}
            proofUrls={proofUrls}
            copy={copy}
            locale={locale}
            idempotencyKey={idempotencyKey}
            showForm={showPaymentForm}
            onRequestPayment={() => setShowPaymentForm(true)}
            onOpenHistory={onOpenHistory}
            onSaved={onPaymentSaved}
          />
        </div>
      ) : null}
    </FormModal>
  );
}
