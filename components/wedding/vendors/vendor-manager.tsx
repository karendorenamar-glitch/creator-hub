"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { deleteVendorAction } from "@/app/wedding/(app)/vendors/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { VendorFormModal } from "@/components/wedding/vendors/vendor-form-modal";
import { Badge } from "@/components/wedding/ui";
import type { Vendor } from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const bookingTone = {
  booked: "success",
  contacted: "neutral",
  considering: "muted",
  cancelled: "warning",
} as const;

export function VendorManager({
  vendors,
  copy,
  locale,
}: {
  vendors: Vendor[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = vendors.filter((vendor) => {
    if (categoryFilter !== "all" && vendor.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== "all" && vendor.booking_status !== statusFilter) {
      return false;
    }
    return true;
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditing(vendor);
    setModalOpen(true);
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
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label={copy.vendors.category}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.vendors.allCategories}</option>
          {Object.keys(labelGroups.vendorCategory).map((value) => (
            <option key={value} value={value}>
              {label("vendorCategory", value, locale)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={copy.vendors.bookingStatus}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.vendors.allStatuses}</option>
          {Object.keys(labelGroups.bookingStatus).map((value) => (
            <option key={value} value={value}>
              {label("bookingStatus", value, locale)}
            </option>
          ))}
        </select>
      </div>

      {vendors.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.vendors.noVendors}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.vendors.emptyFilter}
        </p>
      ) : (
        <ul className="divide-y divide-blush-100 rounded-2xl border border-blush-100 bg-white">
          {filtered.map((vendor) => {
            const price = vendor.agreed_price ?? vendor.quoted_price ?? 0;
            const remaining = Math.max(0, price - vendor.amount_paid);
            return (
              <li
                key={vendor.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {vendor.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {[
                      label("vendorCategory", vendor.category, locale),
                      vendor.contact_name,
                      vendor.phone,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink">
                      {formatIDR(price)}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {copy.vendors.paid}: {formatIDR(vendor.amount_paid)} ·{" "}
                      {copy.vendors.remaining}: {formatIDR(remaining)}
                    </p>
                  </div>
                  <Badge tone={bookingTone[vendor.booking_status]}>
                    {label("bookingStatus", vendor.booking_status, locale)}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => openEdit(vendor)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink"
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

      <VendorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        vendor={editing}
        locale={locale}
      />
    </div>
  );
}
