"use client";

import { useActionState, useEffect } from "react";
import { CalendarDays, FileText, Trash2 } from "lucide-react";
import {
  addVendorPaymentAction,
  deleteVendorPaymentAction,
} from "@/app/wedding/(app)/vendors/actions";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge } from "@/components/wedding/ui";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { VendorPayment } from "@/lib/wedding/db-types";
import { formatIDR, formatWeddingDate } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function PaymentFormModal({
  open,
  onClose,
  copy,
  vendorId,
  vendorName,
  suggestedAmount,
  price,
  history,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  vendorId: string | null;
  vendorName: string;
  suggestedAmount: number;
  price: number | null;
  history: VendorPayment[];
  locale: "en" | "id";
}) {
  const [state, formAction, pending] = useActionState(
    addVendorPaymentAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  const totalPaid = history.reduce((sum, row) => sum + Number(row.amount), 0);
  const remaining = price === null ? null : Math.max(0, price - totalPaid);
  const overpay = remaining !== null && suggestedAmount > remaining;

  return (
    <FormModal open={open} onClose={onClose} wide title={copy.vendors.paymentHistory}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-olive-100 bg-ivory p-4">
          <p className="text-sm font-medium text-ink">{vendorName}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-ink-soft">{copy.vendors.priceFinal}</p>
              <p className="mt-0.5 font-medium text-ink">
                {price === null ? copy.vendors.priceUnknown : formatIDR(price)}
              </p>
            </div>
            <div>
              <p className="text-ink-soft">{copy.vendors.totalPaid}</p>
              <p className="mt-0.5 font-medium text-ink">{formatIDR(totalPaid)}</p>
            </div>
            <div>
              <p className="text-ink-soft">{copy.vendors.billRemaining}</p>
              <p className="mt-0.5 font-medium text-ink">
                {remaining === null ? "—" : formatIDR(remaining)}
              </p>
            </div>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          {vendorId ? (
            <input type="hidden" name="vendorId" value={vendorId} />
          ) : null}
          <FormAlert error={state?.error} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={copy.vendors.paymentKind} htmlFor="payment-kind">
              <select
                id="payment-kind"
                name="paymentKind"
                className={inputClass}
                defaultValue="dp"
              >
                {Object.keys(labelGroups.paymentKind).map((value) => (
                  <option key={value} value={value}>
                    {label("paymentKind", value, locale)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={copy.vendors.paymentAmount} htmlFor="payment-amount">
              <input
                id="payment-amount"
                name="paymentAmount"
                type="number"
                min={1}
                step={1000}
                required
                defaultValue={suggestedAmount > 0 ? suggestedAmount : ""}
                className={inputClass}
              />
            </Field>

            <Field label={copy.vendors.paymentDate} htmlFor="payment-date">
              <input
                id="payment-date"
                name="paidOn"
                type="date"
                required
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
                name="paymentMethod"
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
              name="paymentNotes"
              rows={2}
              maxLength={1000}
              className={inputClass}
            />
          </Field>

          <Field
            label={`${copy.vendors.proofLabel} (${copy.form.optional})`}
            htmlFor="payment-proof"
            hint={copy.vendors.proofHint}
          >
            <input
              id="payment-proof"
              name="proof"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:text-olive-700"
            />
          </Field>

          {overpay ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {copy.vendors.overpaidWarning}:{" "}
              {formatIDR(suggestedAmount - (remaining ?? 0))}.{" "}
              {copy.vendors.overpayConfirm}
            </p>
          ) : null}

          <ModalFooter
            pending={pending}
            submitLabel={copy.form.save}
            savingLabel={copy.form.saving}
            cancelLabel={copy.form.cancel}
            onCancel={onClose}
          />
        </form>

        <div className="space-y-2 border-t border-olive-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
            {copy.vendors.paymentHistory}
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-ink-soft">{copy.vendors.noPayments}</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-olive-100 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      {formatIDR(row.amount)}
                      <span className="ml-2 text-xs text-ink-soft">
                        {label("paymentKind", row.payment_kind, locale)}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <CalendarDays className="size-3" aria-hidden />
                      {formatWeddingDate(row.paid_on, locale)}
                      {row.notes ? ` · ${row.notes}` : ""}
                      {row.proof_path ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3" aria-hidden />
                          {copy.vendors.proofAttached}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">
                      {label("paymentKind", row.payment_kind, locale)}
                    </Badge>
                    <form action={deleteVendorPaymentAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="vendorId" value={vendorId ?? ""} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3" aria-hidden />
                        {copy.form.delete}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FormModal>
  );
}
