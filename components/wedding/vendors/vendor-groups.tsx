"use client";

import { useActionState, useMemo, useState } from "react";
import {
  Archive,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import {
  archiveVendorGroupAction,
  archiveVendorOptionAction,
  createVendorGroupAction,
  selectVendorOptionAction,
  updateVendorGroupAction,
} from "@/app/wedding/(app)/vendors/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { GroupFormModal } from "@/components/wedding/vendors/group-form-modal";
import { VendorFormModal } from "@/components/wedding/vendors/vendor-form-modal";
import { PaymentFormModal } from "@/components/wedding/vendors/payment-form-modal";
import { Badge } from "@/components/wedding/ui";
import type {
  Vendor,
  VendorGroup,
  VendorPayment,
} from "@/lib/wedding/db-types";
import { formatIDR, formatWeddingDate } from "@/lib/wedding/format";
import { label } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const statusTone = {
  lunas: "success",
  dp: "warning",
  diskusi: "muted",
} as const;

/** agreed price if set, otherwise quoted price (null = unknown, not zero). */
function priceOf(vendor: Vendor): number | null {
  if (vendor.agreed_price !== null && vendor.agreed_price !== undefined) {
    return Number(vendor.agreed_price);
  }
  if (vendor.quoted_price !== null && vendor.quoted_price !== undefined) {
    return Number(vendor.quoted_price);
  }
  return null;
}

export function VendorGroups({
  groups,
  vendors,
  payments,
  copy,
  locale,
  picOptions,
}: {
  groups: VendorGroup[];
  vendors: Vendor[];
  payments: VendorPayment[];
  copy: ModuleCopy;
  locale: "en" | "id";
  picOptions: string[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const [groupModal, setGroupModal] = useState<{
    open: boolean;
    editing: VendorGroup | null;
  }>({ open: false, editing: null });

  const [optionModal, setOptionModal] = useState<{
    open: boolean;
    groupId: string | null;
    editing: Vendor | null;
  }>({ open: false, groupId: null, editing: null });

  const [paymentVendor, setPaymentVendor] = useState<Vendor | null>(null);

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

  const vendorsByGroup = useMemo(() => {
    const map = new Map<string, Vendor[]>();
    for (const vendor of vendors) {
      if (!vendor.group_id || vendor.archived_at) continue;
      const bucket = map.get(vendor.group_id) ?? [];
      bucket.push(vendor);
      map.set(vendor.group_id, bucket);
    }
    return map;
  }, [vendors]);

  const needle = query.trim().toLowerCase();
  const visible = groups.filter((group) => {
    if (statusFilter !== "all" && group.status !== statusFilter) return false;
    if (!needle) return true;
    const options = vendorsByGroup.get(group.id) ?? [];
    return [group.name, group.category, group.pic_internal, ...options.flatMap((o) => [o.name, o.contact_name, o.phone])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {copy.vendors.groupsTitle}
          </h2>
          <p className="text-sm text-ink-soft">{copy.vendors.groupsHint}</p>
        </div>
        <AddButton
          label={copy.vendors.addGroup}
          onClick={() => setGroupModal({ open: true, editing: null })}
        />
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
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={copy.vendors.paymentStatus}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.vendors.allStatuses}</option>
          {(["diskusi", "dp", "lunas"] as const).map((status) => (
            <option key={status} value={status}>
              {label("paymentStatus", status, locale)}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.vendors.noGroups}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.vendors.emptyFilter}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((group) => {
            const options = vendorsByGroup.get(group.id) ?? [];
            const selected =
              options.find((o) => o.id === group.selected_vendor_id) ?? null;
            const selectedPrice = selected ? priceOf(selected) : null;
            const selectedPaid = selected
              ? paidByVendor.get(selected.id) ?? 0
              : 0;
            const remaining =
              selectedPrice === null
                ? null
                : Math.max(0, selectedPrice - selectedPaid);
            const overpaid =
              selectedPrice !== null && selectedPaid > selectedPrice;
            const expanded = openGroup === group.id;

            return (
              <div
                key={group.id}
                className="rounded-2xl border border-olive-100 bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {group.name}
                      <span className="ml-2 text-xs font-normal text-ink-soft">
                        {group.category || copy.vendors.uncategorized}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">
                      {copy.vendors.picInternal}:{" "}
                      {group.pic_internal || copy.form.none} · {options.length}{" "}
                      {copy.vendors.options}
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-soft">
                      {selected
                        ? `${copy.vendors.selected}: ${selected.name || copy.vendors.unnamed}`
                        : copy.vendors.notSelected}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-ink">
                        {selectedPrice === null
                          ? copy.vendors.priceUnknown
                          : formatIDR(selectedPrice)}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {copy.vendors.totalPaid}: {formatIDR(selectedPaid)}
                        {remaining !== null
                          ? ` · ${copy.vendors.billRemaining}: ${formatIDR(remaining)}`
                          : ""}
                      </p>
                    </div>
                    <Badge tone={statusTone[group.status]}>
                      {label("paymentStatus", group.status, locale)}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(expanded ? null : group.id)}
                      className="rounded-lg border border-olive-200 px-2.5 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                    >
                      {expanded ? copy.form.close : copy.vendors.compare}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGroupModal({ open: true, editing: group })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      {copy.form.edit}
                    </button>
                    <DeleteForm
                      action={archiveVendorGroupAction}
                      id={group.id}
                      copy={copy}
                      label={copy.vendors.archive}
                    />
                  </div>
                </div>

                {!selected ? (
                  <p className="mx-4 mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
                    {copy.vendors.noVendorChosen}
                  </p>
                ) : null}

                {overpaid ? (
                  <p className="mx-4 mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                    {copy.vendors.overpaidWarning}:{" "}
                    {formatIDR(selectedPaid - (selectedPrice ?? 0))}
                  </p>
                ) : null}

                {expanded ? (
                  <div className="border-t border-olive-100 px-4 py-3">
                    <OptionList
                      group={group}
                      options={options}
                      paidByVendor={paidByVendor}
                      copy={copy}
                      locale={locale}
                      onEdit={(vendor) =>
                        setOptionModal({
                          open: true,
                          groupId: group.id,
                          editing: vendor,
                        })
                      }
                      onPay={(vendor) => setPaymentVendor(vendor)}
                      onAdd={() =>
                        setOptionModal({
                          open: true,
                          groupId: group.id,
                          editing: null,
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <GroupFormModal
        open={groupModal.open}
        editing={groupModal.editing}
        copy={copy}
        locale={locale}
        picOptions={picOptions}
        onClose={() => setGroupModal({ open: false, editing: null })}
      />

      <VendorFormModal
        key={`${optionModal.groupId}-${optionModal.editing?.id ?? "new"}`}
        open={optionModal.open}
        onClose={() =>
          setOptionModal({ open: false, groupId: null, editing: null })
        }
        copy={copy}
        vendor={optionModal.editing}
        locale={locale}
        picOptions={picOptions}
        groupId={optionModal.groupId}
      />

      <PaymentFormModal
        key={paymentVendor?.id ?? "none"}
        open={Boolean(paymentVendor)}
        onClose={() => setPaymentVendor(null)}
        copy={copy}
        vendorId={paymentVendor?.id ?? null}
        vendorName={paymentVendor?.name || copy.vendors.unnamed}
        suggestedAmount={Math.max(
          0,
          (paymentVendor ? priceOf(paymentVendor) ?? 0 : 0) -
            (paymentVendor ? paidByVendor.get(paymentVendor.id) ?? 0 : 0),
        )}
      />
    </div>
  );
}


function OptionList({
  group,
  options,
  paidByVendor,
  copy,
  locale,
  onEdit,
  onPay,
  onAdd,
}: {
  group: VendorGroup;
  options: Vendor[];
  paidByVendor: Map<string, number>;
  copy: ModuleCopy;
  locale: "en" | "id";
  onEdit: (vendor: Vendor) => void;
  onPay: (vendor: Vendor) => void;
  onAdd: () => void;
}) {
  const [state, action, pending] = useActionState(selectVendorOptionAction, null);

  return (
    <div className="space-y-2">
      {state?.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
          {state.error}
        </p>
      ) : null}

      {options.length === 0 ? (
        <p className="text-xs text-ink-soft">{copy.vendors.noOptions}</p>
      ) : (
        options.map((option) => {
          const price = priceOf(option);
          const paid = paidByVendor.get(option.id) ?? 0;
          const remaining = price === null ? null : Math.max(0, price - paid);
          const isSelected = group.selected_vendor_id === option.id;

          return (
            <div
              key={option.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                isSelected
                  ? "border-olive-400 bg-olive-50/60"
                  : "border-olive-100 bg-white"
              }`}
            >
              <form action={action} className="flex items-center gap-2">
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="vendorId" value={option.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className={`size-4 shrink-0 rounded-full border-2 ${
                    isSelected
                      ? "border-olive-600 bg-olive-600"
                      : "border-olive-300"
                  }`}
                  aria-label={copy.vendors.select}
                />
                <span className="text-sm text-ink">
                  {option.name || copy.vendors.unnamed}
                </span>
              </form>

              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                <span>
                  {copy.vendors.quoted}: {option.quoted_price === null ? "—" : formatIDR(option.quoted_price)}
                </span>
                <span>
                  {copy.vendors.agreed}: {option.agreed_price === null ? "—" : formatIDR(option.agreed_price)}
                </span>
                <span>{copy.vendors.totalPaid}: {formatIDR(paid)}</span>
                <span>
                  {copy.vendors.billRemaining}: {remaining === null ? "—" : formatIDR(remaining)}
                </span>
                <button
                  type="button"
                  onClick={() => onPay(option)}
                  className="rounded-lg bg-olive-50 px-2 py-1 text-olive-700 hover:bg-olive-100"
                >
                  {copy.vendors.pay}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(option)}
                  className="rounded-lg px-2 py-1 hover:bg-olive-50"
                >
                  {copy.form.edit}
                </button>
                <DeleteForm
                  action={archiveVendorOptionAction}
                  id={option.id}
                  copy={copy}
                  label={copy.vendors.archive}
                />
              </div>
            </div>
          );
        })
      )}

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-olive-300 px-3 py-1.5 text-xs text-olive-700 hover:bg-olive-50"
      >
        <Plus className="size-3.5" aria-hidden />
        {copy.vendors.addOption}
      </button>
    </div>
  );
}
