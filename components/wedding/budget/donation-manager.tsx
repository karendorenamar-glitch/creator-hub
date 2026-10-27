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
  available = 0,
  donorCovered = 0,
  copy,
}: {
  donations: WeddingDonation[];
  schemaReady: boolean;
  available?: number;
  donorCovered?: number;
  copy: ModuleCopy;
}) {
  const [modal, setModal] = useState<{
    open: boolean;
    editing: WeddingDonation | null;
  }>({ open: false, editing: null });
  const total = donations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <Heart className="size-4 text-petal-400" aria-hidden />
            {copy.budget.donorsTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {copy.budget.donorsHint}
          </p>
        </div>
        {schemaReady ? (
          <button
            type="button"
            onClick={() => setModal({ open: true, editing: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700"
          >
            <Plus className="size-4" aria-hidden />
            {copy.budget.addDonation}
          </button>
        ) : null}
      </div>

      {!schemaReady ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          {copy.budget.donationSchemaRequired}
        </p>
      ) : donations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-petal-200 bg-petal-50/40 px-4 py-6 text-center text-sm text-ink-soft">
          {copy.budget.donationEmpty}
        </p>
      ) : (
        <>
          <div className="grid gap-3 rounded-2xl bg-blush/35 px-4 py-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                {copy.budget.donationTotal}
              </p>
              <p className="mt-1 font-heading text-lg text-rosewood">
                {formatIDR(total)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                {copy.budget.donationAvailable}
              </p>
              <p className="mt-1 font-heading text-lg text-olive-700">
                {formatIDR(available)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                {copy.budget.donorCovered}
              </p>
              <p className="mt-1 font-heading text-lg text-violet-700">
                {formatIDR(donorCovered)}
              </p>
            </div>
          </div>
          <ul className="divide-y divide-petal-100">
            {donations.map((donation) => (
              <li
                key={donation.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {donation.donor_name}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatIDR(donation.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, editing: donation })}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {copy.form.edit}
                  </button>
                  <DeleteForm
                    action={deleteDonationAction}
                    id={donation.id}
                    copy={copy}
                    confirmMessage={copy.budget.deleteDonationConfirm}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
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
