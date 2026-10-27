"use client";

import { useActionState, useEffect, useState } from "react";
import { Heart, Pencil, Plus } from "lucide-react";
import {
  createDonationAction,
  deleteDonationAction,
  updateDonationAction,
} from "@/app/wedding/(app)/budget/donation-actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { Card } from "@/components/wedding/ui";
import type { WeddingDonation } from "@/lib/wedding/db-types";
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

export function DonationManager({
  donations,
  schemaReady,
  copy,
}: {
  donations: WeddingDonation[];
  schemaReady: boolean;
  copy: ModuleCopy;
}) {
  const [modal, setModal] = useState<{
    open: boolean;
    editing: WeddingDonation | null;
  }>({ open: false, editing: null });
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
                  {formatIDR(donation.amount)}
                </p>
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
    </Card>
  );
}
