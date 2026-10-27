"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays, FileText, Plus } from "lucide-react";
import { createVendorPaymentAction } from "@/app/wedding/(app)/vendors/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import type {
  BudgetVendor,
  VendorPaymentSummary,
} from "@/lib/wedding/budget-calc";
import type {
  VendorPayment,
  VendorPaymentProof,
} from "@/lib/wedding/db-types";
import { formatIDR, formatWeddingDate } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { PAYMENT_PROOF_TYPES } from "@/lib/wedding/uploads";

export function VendorPaymentSection({
  vendor,
  payments,
  proofsByPayment,
  proofUrls,
  summary,
  copy,
  locale,
  idempotencyKey,
  showForm,
  onRequestPayment,
  onCancelPayment,
  onSaved,
}: {
  vendor: BudgetVendor;
  payments: VendorPayment[];
  proofsByPayment: Record<string, VendorPaymentProof[]>;
  proofUrls: Record<string, string>;
  summary?: VendorPaymentSummary;
  copy: ModuleCopy;
  locale: "en" | "id";
  idempotencyKey: string;
  showForm: boolean;
  onRequestPayment: () => void;
  onCancelPayment: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createVendorPaymentAction,
    null,
  );
  const [kind, setKind] = useState<"dp" | "lanjutan" | "pelunasan">("dp");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state, onSaved]);

  const history = [...payments].reverse();
  const totalPaid =
    summary?.cashPaid ??
    payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="space-y-4 rounded-2xl border border-[#EAE0D7] bg-[#FBF7F2] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#888176]">
            {copy.vendors.paymentHistory}
          </p>
          <p className="mt-1 text-sm text-[#49463F]">
            {copy.vendors.totalPaid}:{" "}
            <span className="font-medium">{formatIDR(totalPaid)}</span>
          </p>
          {vendor.agreed_price !== null ? (
            <p className="mt-0.5 text-xs text-[#888176]">
              {copy.vendors.remainingPayment}:{" "}
              {formatIDR(summary?.remainingPayment ?? 0)}
            </p>
          ) : null}
        </div>
        {!showForm && !vendor.funded_by_donor ? (
          <button
            type="button"
            onClick={onRequestPayment}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#788568] px-3 py-2 text-xs font-medium text-white hover:bg-[#687558]"
          >
            <Plus className="size-3.5" aria-hidden />
            {copy.vendors.addPayment}
          </button>
        ) : null}
      </div>

      {vendor.funded_by_donor ? (
        <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-xs text-violet-900">
          {copy.vendors.donorCannotPay}
        </p>
      ) : null}

      {history.length === 0 ? (
        <p className="border-t border-[#EAE0D7] pt-3 text-xs text-[#888176]">
          {copy.vendors.noPayments}
        </p>
      ) : (
        <ul className="divide-y divide-[#EAE0D7] border-t border-[#EAE0D7]">
          {history.map((payment) => {
            const proofs = proofsByPayment[payment.id] ?? [];
            const firstPath = proofs[0]?.path ?? payment.proof_path ?? "";
            const firstUrl = firstPath ? proofUrls[firstPath] : undefined;
            return (
              <li key={payment.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#49463F]">
                      {label("paymentKind", payment.payment_kind, locale)}
                    </p>
                    <p className="mt-0.5 text-sm text-[#49463F]">
                      {formatIDR(payment.amount)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#888176]">
                      <CalendarDays className="size-3" aria-hidden />
                      {formatWeddingDate(payment.paid_on, locale)}
                      <span aria-hidden>·</span>
                      {firstUrl ? (
                        <a
                          href={firstUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#788568] hover:underline"
                        >
                          <FileText className="size-3" aria-hidden />
                          {copy.vendors.proofAttached}
                        </a>
                      ) : (
                        <span>{copy.vendors.noProofAttached}</span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showForm ? (
        <form action={formAction} className="space-y-3 border-t border-[#EAE0D7] pt-4">
          <input type="hidden" name="vendorId" value={vendor.id} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <FormAlert error={state?.error} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.vendors.paymentKind} htmlFor="vendor-payment-kind">
              <select
                id="vendor-payment-kind"
                name="paymentKind"
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as typeof kind)
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
              label={copy.vendors.paymentAmount}
              htmlFor="vendor-payment-amount"
            >
              <input
                id="vendor-payment-amount"
                name="paymentAmount"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label={copy.vendors.paymentDate} htmlFor="vendor-payment-date">
              <input
                id="vendor-payment-date"
                name="paidOn"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </Field>

            <Field
              label={`${copy.vendors.paymentNotes} (${copy.form.optional})`}
              htmlFor="vendor-payment-notes"
            >
              <input
                id="vendor-payment-notes"
                name="paymentNotes"
                maxLength={1000}
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label={`${copy.vendors.proofLabel} (${copy.form.optional})`}
            htmlFor="vendor-payment-proof"
            hint={copy.vendors.proofHint}
          >
            <input
              id="vendor-payment-proof"
              name="proof"
              type="file"
              multiple
              accept={PAYMENT_PROOF_TYPES.join(",")}
              className="w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:text-olive-700"
            />
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancelPayment}
              className="rounded-xl px-3 py-2 text-xs text-[#888176] hover:bg-white"
            >
              {copy.form.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-[#788568] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#687558] disabled:opacity-60"
            >
              {pending ? copy.form.saving : copy.vendors.savePayment}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
