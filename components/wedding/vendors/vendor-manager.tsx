"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Wallet } from "lucide-react";
import {
  deleteVendorAction,
  deleteVendorPaymentAction,
} from "@/app/wedding/(app)/vendors/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { PaymentFormModal } from "@/components/wedding/vendors/payment-form-modal";
import { VendorFormModal } from "@/components/wedding/vendors/vendor-form-modal";
import { Badge } from "@/components/wedding/ui";
import type { Vendor, VendorPayment } from "@/lib/wedding/db-types";
import { formatIDR, formatWeddingDate } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const statusTone = {
  lunas: "success",
  dp: "warning",
  diskusi: "muted",
} as const;

export function VendorManager({
  vendors,
  payments,
  proofUrls,
  copy,
  locale,
  picOptions,
}: {
  vendors: Vendor[];
  payments: VendorPayment[];
  proofUrls: Record<string, string>;
  copy: ModuleCopy;
  locale: "en" | "id";
  picOptions: string[];
}) {
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [paymentVendor, setPaymentVendor] = useState<Vendor | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const paidByVendor = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of payments) {
      map.set(
        payment.vendor_id,
        (map.get(payment.vendor_id) ?? 0) + Number(payment.amount),
      );
    }
    return map;
  }, [payments]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(vendors.map((v) => v.category?.trim()).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b)),
    [vendors],
  );

  const vendorNames = useMemo(
    () => new Map(vendors.map((v) => [v.id, v.name || copy.vendors.unnamed])),
    [vendors, copy.vendors.unnamed],
  );

  const needle = query.trim().toLowerCase();
  const filtered = vendors.filter((vendor) => {
    if (needle) {
      const haystack = [
        vendor.name,
        vendor.category,
        vendor.contact_name,
        vendor.phone,
        vendor.pic_internal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (categoryFilter !== "all" && (vendor.category ?? "") !== categoryFilter) {
      return false;
    }
    if (statusFilter !== "all" && vendor.payment_status !== statusFilter) {
      return false;
    }
    return true;
  });

  const recentPayments = [...payments]
    .sort((a, b) => b.paid_on.localeCompare(a.paid_on))
    .slice(0, 8);

  function openCreate() {
    setEditing(null);
    setVendorModalOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditing(vendor);
    setVendorModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.vendors.title}
        </h2>
        <AddButton label={copy.vendors.add} onClick={openCreate} />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.vendors.search}
            aria-label={copy.vendors.search}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label={copy.vendors.category}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.vendors.allCategories}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={copy.vendors.paymentStatus}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.vendors.allStatuses}</option>
          {Object.keys(labelGroups.paymentStatus).map((value) => (
            <option key={value} value={value}>
              {label("paymentStatus", value, locale)}
            </option>
          ))}
        </select>
      </div>

      {vendors.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.vendors.noVendors}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.vendors.emptyFilter}
        </p>
      ) : (
        <ul className="divide-y divide-olive-100 rounded-2xl border border-olive-100 bg-white">
          {filtered.map((vendor) => {
            const bill = Number(vendor.agreed_price ?? vendor.quoted_price ?? 0);
            const paid = paidByVendor.get(vendor.id) ?? 0;
            const remaining = Math.max(0, bill - paid);

            return (
              <li
                key={vendor.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {vendor.name || copy.vendors.unnamed}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {[vendor.category, vendor.contact_name, vendor.phone]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {copy.vendors.picInternal}:{" "}
                    {vendor.pic_internal || copy.form.none}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink">
                      {copy.vendors.actualBill}: {formatIDR(bill)}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {copy.vendors.totalPaid}: {formatIDR(paid)} ·{" "}
                      {copy.vendors.billRemaining}: {formatIDR(remaining)}
                    </p>
                  </div>
                  <Badge tone={statusTone[vendor.payment_status]}>
                    {label("paymentStatus", vendor.payment_status, locale)}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setPaymentVendor(vendor)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-olive-50 px-2.5 py-1.5 text-xs font-medium text-olive-700 transition-colors hover:bg-olive-100"
                  >
                    <Wallet className="size-3.5" aria-hidden />
                    {copy.vendors.pay}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(vendor)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {copy.form.edit}
                  </button>
                  <DeleteForm
                    action={deleteVendorAction}
                    id={vendor.id}
                    copy={copy}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-2xl border border-olive-100 bg-white">
        <h3 className="border-b border-olive-100 px-4 py-3 text-sm font-semibold text-ink">
          {copy.vendors.payments}
        </h3>
        {recentPayments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-soft">
            {copy.vendors.noPayments}
          </p>
        ) : (
          <ul className="divide-y divide-olive-100">
            {recentPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {vendorNames.get(payment.vendor_id) ?? copy.vendors.unnamed}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatWeddingDate(payment.paid_on, locale)}
                    {payment.method ? ` · ${payment.method}` : ""}
                    {payment.notes ? ` · ${payment.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink">
                    {formatIDR(payment.amount)}
                  </span>
                  {payment.proof_path && proofUrls[payment.proof_path] ? (
                    <a
                      href={proofUrls[payment.proof_path]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-olive-50 px-2 py-1 text-xs font-medium text-olive-700 hover:bg-olive-100"
                    >
                      {copy.vendors.viewProof}
                    </a>
                  ) : null}
                  <DeleteForm
                    action={deleteVendorPaymentAction}
                    id={payment.id}
                    copy={copy}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <VendorFormModal
        key={editing?.id ?? "new-vendor"}
        open={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        copy={copy}
        vendor={editing}
        locale={locale}
        picOptions={picOptions}
      />

      <PaymentFormModal
        key={paymentVendor?.id ?? "no-payment"}
        open={Boolean(paymentVendor)}
        onClose={() => setPaymentVendor(null)}
        copy={copy}
        vendorId={paymentVendor?.id ?? null}
        price={null}
        history={[]}
        locale={locale}
        vendorName={paymentVendor?.name || copy.vendors.unnamed}
        suggestedAmount={Math.max(
          0,
          Number(paymentVendor?.agreed_price ?? 0) -
            (paymentVendor ? paidByVendor.get(paymentVendor.id) ?? 0 : 0),
        )}
      />

    </div>
  );
}
