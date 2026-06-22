"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePayout } from "@/app/actions/payouts";
import { FormField, Modal, inputClassName } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  DEFAULT_PAYMENT_TERM_DAYS,
  parsePayoutDate,
  toDateOnlyString,
  type PayoutStatus,
  type PayoutUpdateInput,
} from "@/lib/payouts";
import type { PayoutWithTiming } from "@/types/database";
import { cn } from "@/lib/utils";

type PayoutEditModalProps = {
  open: boolean;
  payout: PayoutWithTiming | null;
  onClose: () => void;
};

const readOnlyInputClassName = cn(
  inputClassName,
  "cursor-not-allowed bg-slate-50 text-slate-600",
);

function toDateInputValue(value: string | null | undefined) {
  const parsed = parsePayoutDate(value);
  return parsed ? toDateOnlyString(parsed) : "";
}

function buildFormState(payout: PayoutWithTiming): PayoutUpdateInput {
  return {
    id: payout.id,
    requested_at: toDateInputValue(payout.requested_at),
    amount: payout.amount,
    payment_term_days: payout.payment_term_days ?? DEFAULT_PAYMENT_TERM_DAYS,
    due_date: toDateInputValue(payout.due_date),
    status: payout.status,
    notes: payout.notes ?? "",
  };
}

export function PayoutEditModal({
  open,
  payout,
  onClose,
}: PayoutEditModalProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<PayoutUpdateInput | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && payout) {
      setForm(buildFormState(payout));
      setError("");
    }
  }, [open, payout]);

  if (!open || !payout || !form) {
    return null;
  }

  function handleChange<K extends keyof PayoutUpdateInput>(
    key: K,
    value: PayoutUpdateInput[K],
  ) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload = form;
    if (!payload) {
      return;
    }

    startTransition(async () => {
      const result = await updatePayout(payload);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      showSuccess("Payout updated");
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Payout"
      description="Update payment details. Creator, campaign, and requested date cannot be changed."
      loading={isPending}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Creator" htmlFor="edit-payout-creator">
            <input
              id="edit-payout-creator"
              type="text"
              value={payout.creators?.name ?? "Unknown"}
              readOnly
              className={readOnlyInputClassName}
            />
          </FormField>

          <FormField label="Campaign" htmlFor="edit-payout-campaign">
            <input
              id="edit-payout-campaign"
              type="text"
              value={payout.campaigns?.name ?? "No campaign"}
              readOnly
              className={readOnlyInputClassName}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Amount (IDR)" htmlFor="edit-payout-amount">
            <input
              id="edit-payout-amount"
              type="number"
              min={1}
              step={1}
              value={form.amount || ""}
              onChange={(event) =>
                handleChange("amount", Number(event.target.value))
              }
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label="Payment Term (days)" htmlFor="edit-payout-term">
            <input
              id="edit-payout-term"
              type="number"
              min={0}
              step={1}
              value={form.payment_term_days}
              onChange={(event) =>
                handleChange(
                  "payment_term_days",
                  Number(event.target.value),
                )
              }
              className={inputClassName}
              required
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Requested Date" htmlFor="edit-payout-requested">
            <input
              id="edit-payout-requested"
              type="date"
              value={form.requested_at}
              readOnly
              className={readOnlyInputClassName}
            />
          </FormField>

          <FormField label="Due Date" htmlFor="edit-payout-due">
            <input
              id="edit-payout-due"
              type="date"
              value={form.due_date}
              onChange={(event) =>
                handleChange("due_date", event.target.value)
              }
              className={inputClassName}
              required
            />
          </FormField>
        </div>

        <FormField label="Status" htmlFor="edit-payout-status">
          <select
            id="edit-payout-status"
            value={form.status}
            onChange={(event) =>
              handleChange("status", event.target.value as PayoutStatus)
            }
            className={inputClassName}
          >
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </FormField>

        <FormField label="Notes" htmlFor="edit-payout-notes">
          <textarea
            id="edit-payout-notes"
            rows={3}
            value={form.notes ?? ""}
            onChange={(event) => handleChange("notes", event.target.value)}
            className={inputClassName}
          />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
