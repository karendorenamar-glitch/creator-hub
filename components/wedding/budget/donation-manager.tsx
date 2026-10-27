"use client";

import { useActionState, useEffect, useState } from "react";
import { Heart, Pencil, Plus } from "lucide-react";
import {
  createDonationAction,
  deleteDonationAction,
  updateDonationAction,
} from "@/app/wedding/(app)/budget/donation-actions";
import {
  createDonationAllocationAction,
  deleteDonationAllocationAction,
  updateDonationAllocationAction,
} from "@/app/wedding/(app)/budget/allocation-actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { Card } from "@/components/wedding/ui";
import type {
  BudgetCategory,
  DonationAllocation,
  WeddingDonation,
} from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

function DonationFormModal({
  open,
  onClose,
  copy,
  donation,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  donation: WeddingDonation | null;
}) {
  const action = donation ? updateDonationAction : createDonationAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={donation ? copy.budget.editDonation : copy.budget.addDonation}
    >
      <form action={formAction} className="space-y-4">
        {donation ? <input type="hidden" name="id" value={donation.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.budget.donorName} htmlFor="donation-name">
          <input
            id="donation-name"
            name="donorName"
            required
            maxLength={120}
            defaultValue={donation?.donor_name ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={`${copy.budget.donationAmount} (IDR)`}
          htmlFor="donation-amount"
        >
          <input
            id="donation-amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            required
            defaultValue={donation?.amount ?? ""}
            className={inputClass}
          />
        </Field>

        <ModalFooter
          pending={pending}
          submitLabel={copy.budget.saveDonation}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}

export function DonationNote({
  donations,
  total,
  excess,
  copy,
}: {
  donations: WeddingDonation[];
  total: number;
  excess: number;
  copy: ModuleCopy;
}) {
  if (donations.length === 0) {
    return (
      <p className="mt-3 text-xs text-ink-soft">
        <span className="mr-1 text-petal-400">♡</span>
        {copy.budget.donationEmpty}
      </p>
    );
  }

  const message =
    donations.length === 1
      ? copy.budget.donationFromSingle
          .replace("{name}", donations[0].donor_name)
          .replace("{amount}", formatIDR(donations[0].amount))
      : copy.budget.donationFromMultiple
          .replace("{count}", String(donations.length))
          .replace("{amount}", formatIDR(total));

  return (
    <div className="mt-3 space-y-1 text-xs text-petal-500">
      <p className="font-medium">💗 {message}</p>
      {excess > 0 ? (
        <p className="text-rosewood">
          {copy.budget.donationExcess.replace("{amount}", formatIDR(excess))}
        </p>
      ) : null}
    </div>
  );
}

function AllocationForm({
  donation,
  allocation,
  categories,
  copy,
  onSaved,
}: {
  donation: WeddingDonation;
  allocation: DonationAllocation | null;
  categories: BudgetCategory[];
  copy: ModuleCopy;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    allocation ? updateDonationAllocationAction : createDonationAllocationAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="space-y-3">
      {allocation ? <input type="hidden" name="id" value={allocation.id} /> : null}
      <input type="hidden" name="donationId" value={donation.id} />
      <FormAlert error={state?.error} success={state?.success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.budget.allocationNeed} htmlFor="allocation-label">
          <input
            id="allocation-label"
            name="label"
            required
            maxLength={120}
            placeholder="Dekorasi"
            defaultValue={allocation?.label ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label={copy.budget.allocationCategory}
          htmlFor="allocation-category"
        >
          <select
            id="allocation-category"
            name="categoryId"
            defaultValue={allocation?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">{copy.form.none}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field
        label={`${copy.budget.allocationAmount} (IDR)`}
        htmlFor="allocation-amount"
      >
        <input
          id="allocation-amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          defaultValue={allocation?.amount ?? ""}
          className={inputClass}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#788568] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#687558] disabled:opacity-60"
        >
          {pending ? copy.form.saving : copy.form.save}
        </button>
      </div>
    </form>
  );
}

function AllocationModal({
  open,
  onClose,
  donation,
  allocations,
  categories,
  schemaReady,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  donation: WeddingDonation | null;
  allocations: DonationAllocation[];
  categories: BudgetCategory[];
  schemaReady: boolean;
  copy: ModuleCopy;
}) {
  const [editing, setEditing] = useState<DonationAllocation | null>(null);
  if (!donation) return null;

  return (
    <FormModal
      open={open}
      onClose={() => {
        setEditing(null);
        onClose();
      }}
      title={copy.budget.allocationTitle}
      wide
    >
      <div className="space-y-5">
        {!schemaReady ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {copy.budget.allocationSchemaRequired}
          </p>
        ) : (
          <>
            {allocations.length > 0 ? (
              <ul className="divide-y divide-[#EAE0D7] border-y border-[#EAE0D7]">
                {allocations.map((allocation) => (
                  <li
                    key={allocation.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[#49463F]">
                        {allocation.label}
                      </p>
                      <p className="text-xs text-[#888176]">
                        {formatIDR(allocation.amount)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setEditing(allocation)}
                        aria-label={copy.form.edit}
                        title={copy.form.edit}
                        className="rounded-lg p-1.5 text-[#888176] hover:bg-[#FBF7F2] hover:text-[#49463F]"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                      <DeleteForm
                        action={deleteDonationAllocationAction}
                        id={allocation.id}
                        copy={copy}
                        label={copy.form.delete}
                        compact
                        confirmMessage={copy.budget.deleteAllocationConfirm}
                      />
                    </div>
                  </li>
                ))}</ul>
            ) : (
              <p className="text-sm text-[#888176]">{copy.budget.allocationEmpty}</p>
            )}

            <div className="rounded-xl bg-[#FBF7F2] p-4">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#796779]">
                {editing ? copy.budget.editAllocation : copy.budget.addAllocation}
              </p>
              <AllocationForm
                key={editing?.id ?? "new-allocation"}
                donation={donation}
                allocation={editing}
                categories={categories}
                copy={copy}
                onSaved={() => {
                  setEditing(null);
                  onClose();
                }}
              />
            </div>
            {editing ? (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs text-[#888176] underline-offset-4 hover:underline"
              >
                {copy.form.cancel}
              </button>
            ) : null}
          </>
        )}
      </div>
    </FormModal>
  );
}

export function DonationManager({
  donations,
  schemaReady,
  allocations,
  categories,
  allocationSchemaReady,
  copy,
}: {
  donations: WeddingDonation[];
  schemaReady: boolean;
  allocations: DonationAllocation[];
  categories: BudgetCategory[];
  allocationSchemaReady: boolean;
  copy: ModuleCopy;
}) {
  const [modal, setModal] = useState<{
    open: boolean;
    editing: WeddingDonation | null;
  }>({ open: false, editing: null });
  const [allocationModal, setAllocationModal] = useState<{
    open: boolean;
    donation: WeddingDonation | null;
  }>({ open: false, donation: null });
  const allocationsByDonation = new Map<string, DonationAllocation[]>();
  for (const allocation of allocations) {
    const bucket = allocationsByDonation.get(allocation.donation_id) ?? [];
    bucket.push(allocation);
    allocationsByDonation.set(allocation.donation_id, bucket);
  }
  return (
    <Card className="border-[#EAE0D7] bg-[#FFFDFC] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-heading text-xl font-semibold text-[#796779]">
          <Heart className="size-4 text-[#C98F97]" strokeWidth={1.6} aria-hidden />
          {copy.budget.donorsTitle}
        </h2>
        {schemaReady ? (
          <button
            type="button"
            onClick={() => setModal({ open: true, editing: null })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#788568] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#687558]"
          >
            <Plus className="size-3.5" aria-hidden />
            {copy.budget.addDonation}
          </button>
        ) : null}
      </div>

      {!schemaReady ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
          {copy.budget.donationSchemaRequired}
        </p>
      ) : donations.length === 0 ? (
        <p className="mt-5 border-t border-[#EAE0D7] pt-5 text-sm text-[#888176]">
          {copy.budget.donationEmpty}
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-[#EAE0D7] border-t border-[#EAE0D7]">
          {donations.map((donation) => (
            <li
              key={donation.id}
              className="flex items-center justify-between gap-3 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#49463F]">
                  {donation.donor_name}
                </p>
                <p className="mt-0.5 text-xs text-[#888176]">
                  {copy.budget.donationTotal}: {formatIDR(donation.amount)}
                </p>
                {(() => {
                  const donationAllocations =
                    allocationsByDonation.get(donation.id) ?? [];
                  const allocated = donationAllocations.reduce(
                    (sum, allocation) => sum + allocation.amount,
                    0,
                  );
                  return (
                    <div className="mt-2 text-[11px] leading-relaxed text-[#888176]">
                      {donationAllocations.length > 0 ? (
                        <>
                          <p className="font-medium text-[#796779]">
                            {copy.budget.allocationTitle}:
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {donationAllocations.map((allocation) => (
                              <li
                                key={allocation.id}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="min-w-0 truncate">
                                  {allocation.label}
                                </span>
                                <span className="shrink-0">
                                  {formatIDR(allocation.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-1.5 flex justify-between gap-3 border-t border-[#EAE0D7] pt-1.5">
                            <span>{copy.budget.allocationTotal}</span>
                            <span>{formatIDR(allocated)}</span>
                          </p>
                          <p className="flex justify-between gap-3">
                            <span>{copy.budget.allocationRemaining}</span>
                            <span>{formatIDR(Math.max(0, donation.amount - allocated))}</span>
                          </p>
                        </>
                      ) : (
                        <p>{copy.budget.allocationEmpty}</p>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setAllocationModal({ open: true, donation })
                        }
                        className="mt-1.5 text-[11px] font-medium text-[#788568] underline-offset-4 hover:underline"
                      >
                        {donationAllocations.length > 0
                          ? copy.budget.setAllocation
                          : copy.budget.setAllocation}
                      </button>
                    </div>
                  );
                })()}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setModal({ open: true, editing: donation })}
                  aria-label={copy.form.edit}
                  title={copy.form.edit}
                  className="rounded-lg p-1.5 text-[#888176] transition-colors hover:bg-[#FBF7F2] hover:text-[#49463F]"
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
                <DeleteForm
                  action={deleteDonationAction}
                  id={donation.id}
                  copy={copy}
                  label={copy.form.delete}
                  compact
                  confirmMessage={copy.budget.deleteDonationConfirm}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <DonationFormModal
        key={modal.editing?.id ?? "new-donation"}
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        copy={copy}
        donation={modal.editing}
      />

      <AllocationModal
        open={allocationModal.open}
        onClose={() => setAllocationModal({ open: false, donation: null })}
        donation={allocationModal.donation}
        allocations={
          allocationModal.donation
            ? (allocationsByDonation.get(allocationModal.donation.id) ?? [])
            : []
        }
        categories={categories}
        schemaReady={allocationSchemaReady}
        copy={copy}
      />
    </Card>
  );
}
