"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
  createOtherCostAction,
  deleteOtherCostAction,
  updateOtherCostAction,
} from "@/app/wedding/(app)/budget/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import {
  AddButton,
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge } from "@/components/wedding/ui";
import type { BudgetOtherCost } from "@/lib/wedding/budget-calc";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

function OtherCostFormModal({
  open,
  onClose,
  copy,
  cost,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  cost: BudgetOtherCost | null;
}) {
  const action = cost ? updateOtherCostAction : createOtherCostAction;
  const [state, formAction, pending] = useActionState(action, null);
  const initialStatus =
    cost && cost.amount > 0 && cost.paidAmount >= cost.amount
      ? "paid"
      : cost && cost.paidAmount > 0
        ? "partial"
        : "unpaid";
  const [status, setStatus] = useState<"unpaid" | "partial" | "paid">(
    initialStatus,
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={cost ? copy.budget.editOtherCost : copy.budget.addOtherCost}
    >
      <form action={formAction} className="space-y-4">
        {cost?.id ? <input type="hidden" name="id" value={cost.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.budget.otherCostName} htmlFor="other-cost-name">
          <input
            id="other-cost-name"
            name="name"
            required
            maxLength={120}
            defaultValue={cost?.name ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label={`${copy.budget.otherCostAmount} (IDR)`} htmlFor="other-cost-amount">
          <input
            id="other-cost-amount"
            name="amount"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            required
            defaultValue={cost?.amount ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label={copy.budget.otherCostStatus} htmlFor="other-cost-status">
          <select
            id="other-cost-status"
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as typeof status)
            }
            className={inputClass}
          >
            <option value="unpaid">{copy.budget.otherCostUnpaid}</option>
            <option value="partial">{copy.budget.otherCostPartial}</option>
            <option value="paid">{copy.budget.otherCostPaid}</option>
          </select>
        </Field>

        {status === "partial" ? (
          <Field
            label={`${copy.budget.otherCostAmountPaid} (IDR)`}
            htmlFor="other-cost-amount-paid"
          >
            <input
              id="other-cost-amount-paid"
              name="amountPaid"
              type="number"
              min={1}
              step={1000}
              inputMode="numeric"
              required
              defaultValue={initialStatus === "partial" ? cost?.paidAmount || "" : ""}
              className={inputClass}
            />
          </Field>
        ) : null}

        <ModalFooter
          pending={pending}
          submitLabel={copy.form.save}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}

export function OtherCostManager({
  otherCosts,
  copy,
}: {
  otherCosts: BudgetOtherCost[];
  copy: ModuleCopy;
}) {
  const [modal, setModal] = useState<{
    open: boolean;
    editing: BudgetOtherCost | null;
  }>({ open: false, editing: null });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {copy.budget.otherCosts}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {copy.budget.otherCostsHint}
          </p>
        </div>
        <AddButton
          label={copy.budget.addOtherCost}
          onClick={() => setModal({ open: true, editing: null })}
        />
      </div>

      {otherCosts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.budget.noOtherCosts}
        </p>
      ) : (
        <ul className="divide-y divide-olive-100 rounded-2xl border border-olive-100 bg-white">
          {otherCosts.map((cost) => (
            <li
              key={cost.id ?? `${cost.name}-${cost.amount}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {cost.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatIDR(cost.amount)}
                  {cost.paidAmount > 0
                    ? ` · ${formatIDR(cost.paidAmount)} ${copy.budget.paidOf}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    cost.amount > 0 && cost.paidAmount >= cost.amount
                      ? "success"
                      : cost.paidAmount > 0
                        ? "warning"
                        : "muted"
                  }
                >
                  {cost.amount > 0 && cost.paidAmount >= cost.amount
                    ? copy.budget.otherCostPaid
                    : cost.paidAmount > 0
                      ? copy.budget.otherCostPartial
                      : copy.budget.otherCostUnpaid}
                </Badge>
                <button
                  type="button"
                  onClick={() => setModal({ open: true, editing: cost })}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {copy.form.edit}
                </button>
                {cost.id ? (
                  <DeleteForm
                    action={deleteOtherCostAction}
                    id={cost.id}
                    copy={copy}
                    confirmMessage={copy.budget.deleteOtherCostConfirm}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <OtherCostFormModal
        key={modal.editing?.id ?? "new-other-cost"}
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        copy={copy}
        cost={modal.editing}
      />
    </div>
  );
}
