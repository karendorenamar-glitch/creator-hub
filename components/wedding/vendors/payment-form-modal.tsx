"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays, FileText, Pencil, Trash2 } from "lucide-react";
import {
  createVendorPaymentAction,
  deleteLegacyPaymentProofAction,
  deleteVendorPaymentAction,
  deleteVendorPaymentProofAction,
  updateVendorPaymentAction,
} from "@/app/wedding/(app)/vendors/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge } from "@/components/wedding/ui";
import { PaymentStatusBadge } from "@/components/wedding/vendors/payment-status-badge";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type {
  VendorPayment,
  VendorPaymentProof,
} from "@/lib/wedding/db-types";
import type { BudgetVendor } from "@/lib/wedding/budget-calc";
import { derivePaymentStatus } from "@/lib/wedding/budget-calc";
import { formatIDR, formatWeddingDate } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import {
  PAYMENT_PROOF_TYPES,
  validatePaymentProofFile,
} from "@/lib/wedding/uploads";

const fileClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-olive-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-olive-700";

export function PaymentFormModal({
  open,
  onClose,
  copy,
  locale,
  vendor,
  payment,
  proofs,
  history,
  proofsByPayment,
  proofUrls,
  onEditPayment,
  idempotencyKey,
  readOnly = false,
  historyOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  locale: "en" | "id";
  vendor: BudgetVendor | null;
  payment: VendorPayment | null;
  proofs: VendorPaymentProof[];
  history: VendorPayment[];
  proofsByPayment: Record<string, VendorPaymentProof[]>;
  proofUrls: Record<string, string>;
  onEditPayment: (payment: VendorPayment) => void;
  idempotencyKey: string;
  readOnly?: boolean;
  historyOnly?: boolean;
}) {
  const action = payment ? updateVendorPaymentAction : createVendorPaymentAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [amount, setAmount] = useState<string>(
    payment ? String(payment.amount) : "",
  );
  const [kind, setKind] = useState<"dp" | "lanjutan" | "pelunasan">(
    payment?.payment_kind ?? "dp",
  );
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  const totalPaid = history.reduce((sum, row) => sum + Number(row.amount), 0);
  const otherPaid = payment ? totalPaid - Number(payment.amount) : totalPaid;
  const price = vendor?.agreed_price ?? null;
  const outstanding =
    price === null
      ? null
      : Math.max(0, price - (payment ? otherPaid : totalPaid));
  const entered = Number(amount || 0);
  const overpay = outstanding !== null && entered > outstanding;
  const incompleteFinal =
    kind === "pelunasan" &&
    outstanding !== null &&
    entered > 0 &&
    entered < outstanding;
  const status = derivePaymentStatus(
    price,
    history,
    vendor?.collaboration_completed_at ?? null,
    Boolean(vendor?.funded_by_donor),
  );
  const legacyProofVisible = Boolean(
    payment?.proof_path &&
      !proofs.some((proof) => proof.path === payment.proof_path),
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={
        payment
          ? copy.vendors.editPayment
          : readOnly || historyOnly
            ? copy.vendors.paymentHistory
            : copy.vendors.recordPayment
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-olive-100 bg-ivory p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">
              {vendor?.name || copy.vendors.unnamed}
            </p>
            <PaymentStatusBadge status={status} copy={copy} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-ink-soft">{copy.vendors.agreedPrice}</p>
              <p className="mt-0.5 font-medium text-ink">
                {price === null ? copy.vendors.priceUnknown : formatIDR(price)}
              </p>
            </div>
            <div>
              <p className="text-ink-soft">{copy.vendors.totalPaid}</p>
              <p className="mt-0.5 font-medium text-ink">{formatIDR(totalPaid)}</p>
            </div>
            <div>
              <p className="text-ink-soft">{copy.vendors.remainingPayment}</p>
              <p className="mt-0.5 font-medium text-ink">
                {outstanding === null ? "—" : formatIDR(outstanding)}
              </p>
            </div>
          </div>
        </div>

        {!readOnly && !historyOnly ? (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="vendorId" value={vendor?.id ?? ""} />
            {payment ? (
              <input type="hidden" name="paymentId" value={payment.id} />
            ) : (
              <input
                type="hidden"
                name="idempotencyKey"
                value={idempotencyKey}
              />
            )}
            <FormAlert error={state?.error ?? fileError ?? undefined} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.vendors.paymentKind} htmlFor="payment-kind">
                <select
                  id="payment-kind"
                  name="paymentKind"
                  value={kind}
                  onChange={(event) => {
                    const next = event.target.value as typeof kind;
                    setKind(next);
                    if (
                      next === "pelunasan" &&
                      outstanding !== null &&
                      !amount
                    ) {
                      setAmount(String(outstanding));
                    }
                  }}
                  className={inputClass}
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
                  step={1}
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label={copy.vendors.paymentDate} htmlFor="payment-date">
                <input
                  id="payment-date"
                  name="paidOn"
                  type="date"
                  required
                  defaultValue={
                    payment?.paid_on ?? new Date().toISOString().slice(0, 10)
                  }
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
                  defaultValue={payment?.method ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>

            {kind === "pelunasan" && outstanding !== null ? (
              <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs text-ink-soft">
                {copy.vendors.pelunasanSuggestion}: {formatIDR(outstanding)}
              </p>
            ) : null}

            <Field
              label={`${copy.vendors.paymentNotes} (${copy.form.optional})`}
              htmlFor="payment-notes"
            >
              <textarea
                id="payment-notes"
                name="paymentNotes"
                rows={2}
                maxLength={1000}
                defaultValue={payment?.notes ?? ""}
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
                multiple
                accept={PAYMENT_PROOF_TYPES.join(",")}
                className={fileClass}
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  const invalid = files
                    .map((file) => validatePaymentProofFile(file))
                    .find((result) => !result.ok);
                  setFileError(
                    invalid && !invalid.ok
                      ? invalid.error === "too_large"
                        ? copy.vendors.proofTooLarge
                        : copy.vendors.proofInvalidType
                      : null,
                  );
                }}
              />
            </Field>

            {incompleteFinal ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {copy.vendors.pelunasanIncomplete}
              </p>
            ) : null}

            {overpay ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {copy.vendors.overpaidWarning}:{" "}
                {formatIDR(entered - (outstanding ?? 0))}.{" "}
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
        ) : null}


        {payment ? (
          <div className="space-y-2 border-t border-olive-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
              {copy.vendors.proofFiles}
            </p>
            {proofs.length === 0 && !payment.proof_path ? (
              <p className="text-sm text-ink-soft">{copy.vendors.noProofs}</p>
            ) : (
              <ul className="space-y-2">
                {proofs.map((proof) => (
                  <li
                    key={proof.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-olive-100 bg-white px-3 py-2"
                  >
                    <a
                      href={proofUrls[proof.path] ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 text-sm text-olive-700 hover:underline"
                    >
                      <FileText className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {proof.original_name ?? copy.vendors.proofAttached}
                      </span>
                    </a>
                    {!readOnly ? (
                      <DeleteForm
                        action={deleteVendorPaymentProofAction}
                        id={proof.id}
                        copy={copy}
                        label={copy.form.delete}
                      />
                    ) : null}
                  </li>
                ))}
                {legacyProofVisible && payment.proof_path ? (
                  <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-olive-100 bg-white px-3 py-2">
                    <a
                      href={proofUrls[payment.proof_path] ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 text-sm text-olive-700 hover:underline"
                    >
                      <FileText className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{copy.vendors.legacyProof}</span>
                    </a>
                    {!readOnly ? (
                      <form
                        action={deleteLegacyPaymentProofAction}
                        onSubmit={(event) => {
                          if (!window.confirm(copy.vendors.deleteProofConfirm)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input
                          type="hidden"
                          name="paymentId"
                          value={payment.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3" aria-hidden />
                          {copy.form.delete}
                        </button>
                      </form>
                    ) : null}
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        ) : null}


        <div className="space-y-2 border-t border-olive-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
            {copy.vendors.paymentHistory}
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-ink-soft">{copy.vendors.noPayments}</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => {
                const rowProofs = proofsByPayment[row.id] ?? [];
                return (
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
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                        <CalendarDays className="size-3" aria-hidden />
                        {formatWeddingDate(row.paid_on, locale)}
                        {row.notes ? ` · ${row.notes}` : ""}
                        {rowProofs.length > 0 || row.proof_path ? (
                          <span className="inline-flex items-center gap-1">
                            <FileText className="size-3" aria-hidden />
                            {copy.vendors.proofAttached}
                          </span>
                        ) : null}
                      </p>
                      {rowProofs.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {rowProofs.map((proof) => (
                            <a
                              key={proof.id}
                              href={proofUrls[proof.path] ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-olive-700 hover:underline"
                            >
                              {proof.original_name ?? copy.vendors.proofAttached}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {row.proof_path &&
                      !rowProofs.some(
                        (proof) => proof.path === row.proof_path,
                      ) ? (
                        <a
                          href={proofUrls[row.proof_path] ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex text-[11px] text-olive-700 hover:underline"
                        >
                          {copy.vendors.legacyProof}
                        </a>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="muted">
                        {label("paymentKind", row.payment_kind, locale)}
                      </Badge>
                      {!readOnly ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditPayment(row)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-soft hover:bg-olive-50"
                          >
                            <Pencil className="size-3" aria-hidden />
                            {copy.form.edit}
                          </button>
                          <DeleteForm
                            action={deleteVendorPaymentAction}
                            id={row.id}
                            copy={copy}
                            label={copy.form.delete}
                          />
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </FormModal>
  );
}
