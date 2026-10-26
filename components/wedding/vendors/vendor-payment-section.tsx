"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays, FileText } from "lucide-react";
import { createVendorPaymentAction } from "@/app/wedding/(app)/vendors/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { BudgetVendor } from "@/lib/wedding/budget-calc";
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
  copy,
  locale,
  idempotencyKey,
  showForm,
  onRequestPayment,
  onOpenHistory,
  onSaved,
}: {
  vendor: BudgetVendor;
  payments: VendorPayment[];
  proofsByPayment: Record<string, VendorPaymentProof[]>;
  proofUrls: Record<string, string>;
  copy: ModuleCopy;
  locale: "en" | "id";
  idempotencyKey: string;
  showForm: boolean;
  onRequestPayment: () => void;
  onOpenHistory: () => void;
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

  const recent = payments.slice(-3).reverse();

  return (
    <div className="space-y-4 rounded-2xl border border-olive-100 bg-olive-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
            {showForm ? copy.vendors.addPayment : copy.vendors.paymentHistory}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {showForm
              ? copy.vendors.addPaymentHint
              : copy.vendors.paymentHistoryHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!showForm ? (
            <button
              type="button"
              onClick={onRequestPayment}
              className="rounded-lg bg-olive-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-olive-700"
            >
              {copy.vendors.recordPayment}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenHistory}
            className="rounded-lg border border-olive-200 bg-white px-3 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-50"
          >
            {copy.vendors.viewPaymentHistory}
          </button>
        </div>
      </div>

      {showForm ? (
        <form action={formAction} className="space-y-3">
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

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
          >
            {pending ? copy.form.saving : copy.vendors.savePayment}
          </button>
        </form>
      ) : null}

      <div className="space-y-2 border-t border-olive-100 pt-3">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
          {copy.vendors.recentPayments}
        </p>
        {recent.length === 0 ? (
          <p className="text-xs text-ink-soft">{copy.vendors.noPayments}</p>
        ) : (
          <ul className="space-y-1.5">
            {recent.map((payment) => {
              const proofs = proofsByPayment[payment.id] ?? [];
              const firstPath = proofs[0]?.path ?? payment.proof_path ?? "";
              const firstUrl = firstPath ? proofUrls[firstPath] : undefined;
              return (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs"
                >
                  <span className="text-ink">
                    {formatIDR(payment.amount)} ·{" "}
                    {label("paymentKind", payment.payment_kind, locale)}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <CalendarDays className="size-3" aria-hidden />
                    {formatWeddingDate(payment.paid_on, locale)}
                    {firstUrl ? (
                      <a
                        href={firstUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-olive-700 hover:underline"
                      >
                        <FileText className="size-3" aria-hidden />
                        {copy.vendors.proofAttached}
                      </a>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
