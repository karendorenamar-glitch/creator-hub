"use client";

import { useMemo, useState } from "react";
import { History, Pencil } from "lucide-react";
import { deleteVendorAction } from "@/app/wedding/(app)/vendors/actions";
import { AddButton } from "@/components/wedding/form-kit";
import { DeleteForm } from "@/components/wedding/delete-form";
import { Card } from "@/components/wedding/ui";
import { PaymentStatusBadge } from "@/components/wedding/vendors/payment-status-badge";
import { VendorFormModal } from "@/components/wedding/vendors/vendor-form-modal";
import { PaymentFormModal } from "@/components/wedding/vendors/payment-form-modal";
import type {
  BudgetVendor,
  VendorPaymentSummary,
} from "@/lib/wedding/budget-calc";
import type {
  VendorPayment,
  VendorPaymentProof,
} from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import { groupProofsByPayment } from "@/lib/wedding/payment-proofs";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import type { VendorOptionPrefill } from "@/lib/wedding/vendor-options";

function VendorRow({
  vendor,
  summary,
  copy,
  archived,
  onEdit,
  onHistory,
}: {
  vendor: BudgetVendor;
  summary: VendorPaymentSummary;
  copy: ModuleCopy;
  archived: boolean;
  onEdit: () => void;
  onHistory: () => void;
}) {
  const price = vendor.agreed_price;
  return (
    <div className="rounded-2xl border border-olive-100 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {vendor.name?.trim() || copy.vendors.unnamed}
            <span className="ml-2 text-xs font-normal text-ink-soft">
              {vendor.category || copy.vendors.uncategorized}
            </span>
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            {copy.vendors.picVendor}: {vendor.contact_name || copy.form.none}
            {vendor.phone ? ` · ${vendor.phone}` : ""}
          </p>
          {price === null ? (
            <p className="mt-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">
              {copy.vendors.missingAgreedPrice}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-ink">
              {price === null ? copy.vendors.priceUnknown : formatIDR(price)}
            </p>
            <p className="text-xs text-ink-soft">
              {copy.vendors.totalPaid}: {formatIDR(summary.totalPaid)}
            </p>
            <p className="text-xs text-ink-soft">
              {copy.vendors.remainingPayment}:{" "}
              {price === null ? "—" : formatIDR(summary.remainingPayment)}
            </p>
            {summary.overpayment > 0 ? (
              <p className="text-xs font-medium text-amber-700">
                {copy.vendors.overpayment}: {formatIDR(summary.overpayment)}
              </p>
            ) : null}
          </div>
          <PaymentStatusBadge
            status={summary.paymentStatus}
            copy={copy}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-olive-100 pt-2">
        {!archived ? (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
            >
              <Pencil className="size-3.5" aria-hidden />
              {copy.form.edit}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={onHistory}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
        >
          <History className="size-3.5" aria-hidden />
          {copy.vendors.paymentHistory}
        </button>
        <DeleteForm
          action={deleteVendorAction}
          id={vendor.id}
          copy={copy}
          label={copy.vendors.deleteVendor}
          confirmMessage={copy.vendors.deleteVendorConfirm}
          confirmLabel={copy.vendors.deleteVendorConfirmLabel}
        />
      </div>
    </div>
  );
}

function paymentStatusRank(status?: VendorPaymentSummary["paymentStatus"]) {
  switch (status) {
    case "lunas":
      return 0;
    case "donor":
      return 1;
    case "termin_lanjutan":
      return 1;
    case "dp":
      return 2;
    case "incomplete":
      return 4;
    case "diskusi":
    default:
      return 3;
  }
}

export function VendorList({
  activeVendors,
  archivedVendors,
  payments,
  proofs,
  proofUrls,
  summaryByVendor,
  copy,
  locale,
  prefill,
  initialVendorId,
}: {
  activeVendors: BudgetVendor[];
  archivedVendors: BudgetVendor[];
  payments: VendorPayment[];
  proofs: VendorPaymentProof[];
  proofUrls: Record<string, string>;
  summaryByVendor: Record<string, VendorPaymentSummary>;
  copy: ModuleCopy;
  locale: "en" | "id";
  prefill?: VendorOptionPrefill | null;
  initialVendorId?: string | null;
}) {
  const initialVendor = useMemo(
    () =>
      initialVendorId
        ? ([...activeVendors, ...archivedVendors].find(
            (vendor) => vendor.id === initialVendorId,
          ) ?? null)
        : null,
    [activeVendors, archivedVendors, initialVendorId],
  );
  const [vendorModal, setVendorModal] = useState<{
    open: boolean;
    editing: BudgetVendor | null;
    idempotencyKey: string;
    prefill: VendorOptionPrefill | null;
  }>({
    open: Boolean(initialVendor || prefill),
    editing: initialVendor,
    idempotencyKey: "",
    prefill: initialVendor ? null : (prefill ?? null),
  });
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    vendor: BudgetVendor | null;
    payment: VendorPayment | null;
    readOnly: boolean;
    historyOnly: boolean;
    idempotencyKey: string;
  }>({
    open: false,
    vendor: null,
    payment: null,
    readOnly: false,
    historyOnly: false,
    idempotencyKey: "",
  });

  const paymentsByVendor = useMemo(() => {
    const map = new Map<string, VendorPayment[]>();
    for (const payment of payments) {
      const bucket = map.get(payment.vendor_id) ?? [];
      bucket.push(payment);
      map.set(payment.vendor_id, bucket);
    }
    return map;
  }, [payments]);

  const proofsByPayment = useMemo(
    () => groupProofsByPayment(proofs),
    [proofs],
  );

  const sortedActiveVendors = useMemo(
    () =>
      [...activeVendors].sort((a, b) => {
        const rankDiff =
          paymentStatusRank(summaryByVendor[a.id]?.paymentStatus) -
          paymentStatusRank(summaryByVendor[b.id]?.paymentStatus);
        if (rankDiff !== 0) return rankDiff;
        return (a.name ?? "").localeCompare(b.name ?? "");
      }),
    [activeVendors, summaryByVendor],
  );

  function emptySummary(): VendorPaymentSummary {
    return {
      paymentCount: 0,
      cashPaid: 0,
      donorFunded: 0,
      totalPaid: 0,
      remainingPayment: 0,
      overpayment: 0,
      paymentStatus: "diskusi",
    };
  }

  function openPayment(
    vendor: BudgetVendor,
    readOnly: boolean,
    historyOnly = false,
  ) {
    setPaymentModal({
      open: true,
      vendor,
      payment: null,
      readOnly,
      historyOnly,
      idempotencyKey: readOnly ? "" : crypto.randomUUID(),
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.vendors.title}
        </h2>
        <AddButton
          label={copy.vendors.add}
          onClick={() =>
            setVendorModal({
              open: true,
              editing: null,
              idempotencyKey: crypto.randomUUID(),
              prefill: null,
            })
          }
        />
      </div>

      {activeVendors.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-10 text-center text-sm text-ink-soft">
          {copy.vendors.noVendors}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedActiveVendors.map((vendor) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              summary={summaryByVendor[vendor.id] ?? emptySummary()}
              copy={copy}
              archived={false}
              onEdit={() =>
                setVendorModal({
                  open: true,
                  editing: vendor,
                  idempotencyKey: crypto.randomUUID(),
                  prefill: null,
                })
              }
              onHistory={() => openPayment(vendor, false, true)}
            />
          ))}
        </div>
      )}

      {archivedVendors.length > 0 ? (
        <Card className="space-y-3">
          <h3 className="font-heading text-base font-semibold text-ink">
            {copy.vendors.archived}
          </h3>
          <p className="text-xs text-ink-soft">{copy.vendors.archivedHint}</p>
          <div className="space-y-3">
            {archivedVendors.map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
                summary={summaryByVendor[vendor.id] ?? emptySummary()}
                copy={copy}
                archived
                onEdit={() => undefined}
                onHistory={() => openPayment(vendor, true)}
              />
            ))}
          </div>
        </Card>
      ) : null}

      <VendorFormModal
        key={`${vendorModal.editing?.id ?? "new-vendor"}-${vendorModal.idempotencyKey}`}
        open={vendorModal.open}
        onClose={() =>
          setVendorModal({
            open: false,
            editing: null,
            idempotencyKey: "",
            prefill: null,
          })
        }
        copy={copy}
        locale={locale}
        vendor={vendorModal.editing}
        payments={
          vendorModal.editing
            ? (paymentsByVendor.get(vendorModal.editing.id) ?? [])
            : []
        }
        proofsByPayment={proofsByPayment}
        proofUrls={proofUrls}
        summary={
          vendorModal.editing
            ? summaryByVendor[vendorModal.editing.id]
            : undefined
        }
        idempotencyKey={vendorModal.idempotencyKey}
        prefill={vendorModal.prefill}
        onPaymentSaved={() =>
          setVendorModal({
            open: false,
            editing: null,
            idempotencyKey: "",
            prefill: null,
          })
        }
      />

      <PaymentFormModal
        key={`${paymentModal.vendor?.id ?? "none"}-${paymentModal.payment?.id ?? "new"}-${paymentModal.readOnly}-${paymentModal.historyOnly}`}
        open={paymentModal.open}
        onClose={() =>
          setPaymentModal({
            open: false,
            vendor: null,
            payment: null,
            readOnly: false,
            historyOnly: false,
            idempotencyKey: "",
          })
        }
        copy={copy}
        locale={locale}
        vendor={paymentModal.vendor}
        payment={paymentModal.payment}
        proofs={
          paymentModal.payment
            ? (proofsByPayment[paymentModal.payment.id] ?? [])
            : []
        }
        history={
          paymentModal.vendor
            ? (paymentsByVendor.get(paymentModal.vendor.id) ?? [])
            : []
        }
        proofsByPayment={proofsByPayment}
        proofUrls={proofUrls}
        idempotencyKey={paymentModal.idempotencyKey}
        readOnly={paymentModal.readOnly}
        historyOnly={paymentModal.historyOnly}
        onEditPayment={(payment) =>
          setPaymentModal((current) => ({
            ...current,
            payment,
            historyOnly: false,
            readOnly: false,
          }))
        }
      />
    </>
  );
}

