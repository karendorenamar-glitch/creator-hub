"use client";

import { useEffect, useState, useTransition } from "react";
import { createPayout } from "@/app/actions/payouts";
import { FormField, Modal, inputClassName } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  DEFAULT_PAYMENT_TERM_DAYS,
  getTodayDateOnly,
  type PayoutInput,
} from "@/lib/payouts";
import type { CampaignOption, Creator } from "@/types/database";

type PayoutFormModalProps = {
  open: boolean;
  onClose: () => void;
  creators: Creator[];
  campaigns: CampaignOption[];
};

const emptyForm = (): PayoutInput => ({
  creator_id: "",
  campaign_id: null,
  amount: 0,
  requested_at: getTodayDateOnly(),
  due_date: null,
  payment_term_days: DEFAULT_PAYMENT_TERM_DAYS,
  notes: "",
});

export function PayoutFormModal({
  open,
  onClose,
  creators,
  campaigns,
}: PayoutFormModalProps) {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<PayoutInput>(emptyForm);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError("");
    }
  }, [open]);

  function handleChange<K extends keyof PayoutInput>(
    key: K,
    value: PayoutInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createPayout(form);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      showSuccess("Payout created.");
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Payout"
      description="Due date is calculated automatically from payment terms when left empty."
      loading={isPending}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Creator" htmlFor="payout-creator">
          <select
            id="payout-creator"
            value={form.creator_id}
            onChange={(event) => handleChange("creator_id", event.target.value)}
            className={inputClassName}
            required
          >
            <option value="">Select creator</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Campaign" htmlFor="payout-campaign">
          <select
            id="payout-campaign"
            value={form.campaign_id ?? ""}
            onChange={(event) =>
              handleChange("campaign_id", event.target.value || null)
            }
            className={inputClassName}
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Amount (IDR)" htmlFor="payout-amount">
            <input
              id="payout-amount"
              type="number"
              min={1}
              step={1}
              value={form.amount || ""}
              onChange={(event) =>
                handleChange("amount", Number(event.target.value) || 0)
              }
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label="Payment Term (days)" htmlFor="payout-term">
            <input
              id="payout-term"
              type="number"
              min={0}
              step={1}
              value={form.payment_term_days ?? DEFAULT_PAYMENT_TERM_DAYS}
              onChange={(event) =>
                handleChange(
                  "payment_term_days",
                  Number(event.target.value) || DEFAULT_PAYMENT_TERM_DAYS,
                )
              }
              className={inputClassName}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Requested Date" htmlFor="payout-requested">
            <input
              id="payout-requested"
              type="date"
              value={form.requested_at ?? ""}
              onChange={(event) =>
                handleChange("requested_at", event.target.value)
              }
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label="Due Date (optional)" htmlFor="payout-due">
            <input
              id="payout-due"
              type="date"
              value={form.due_date ?? ""}
              onChange={(event) =>
                handleChange("due_date", event.target.value || null)
              }
              className={inputClassName}
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="payout-notes">
          <textarea
            id="payout-notes"
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
            className="rounded-lg bg-kefoo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-500 disabled:opacity-60"
          >
            Create Payout
          </button>
        </div>
      </form>
    </Modal>
  );
}
