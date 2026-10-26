"use client";

import { useActionState, useEffect } from "react";
import {
  createChecklistItemAction,
  updateChecklistItemAction,
} from "@/app/wedding/(app)/checklist/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { Checklist, ChecklistTask } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function ChecklistItemFormModal({
  open,
  onClose,
  copy,
  locale,
  checklist,
  item,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  locale: "en" | "id";
  checklist: Checklist;
  item: ChecklistTask | null;
}) {
  const action = item ? updateChecklistItemAction : createChecklistItemAction;
  const [state, formAction, pending] = useActionState(action, null);
  const locked = checklist.kind === "builtin_kua";

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={item ? copy.checklist.editItem : copy.checklist.addItem}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="checklistId" value={checklist.id} />
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        {locked && item ? (
          <input type="hidden" name="title" value={item.title} />
        ) : null}
        <FormAlert error={state?.error} />

        {locked && item ? (
          <div className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
              {copy.checklist.itemTitle}
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {copy.checklist.templateItemLocked}
            </p>
          </div>
        ) : (
          <Field label={copy.checklist.itemTitle} htmlFor="checklist-item-title">
            <input
              id="checklist-item-title"
              name="title"
              required
              maxLength={160}
              defaultValue={item?.title ?? ""}
              className={inputClass}
            />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.checklist.dueDate} htmlFor="checklist-item-due">
            <input
              id="checklist-item-due"
              name="dueDate"
              type="date"
              defaultValue={item?.due_date ?? ""}
              className={inputClass}
            />
          </Field>

          {!locked ? (
            <>
              <Field label={copy.checklist.stage} htmlFor="checklist-item-stage">
                <select
                  id="checklist-item-stage"
                  name="stage"
                  defaultValue={item?.stage ?? "planning"}
                  className={inputClass}
                >
                  {Object.keys(labelGroups.stage).map((value) => (
                    <option key={value} value={value}>
                      {label("stage", value, locale)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={copy.checklist.priority}
                htmlFor="checklist-item-priority"
              >
                <select
                  id="checklist-item-priority"
                  name="priority"
                  defaultValue={item?.priority ?? "medium"}
                  className={inputClass}
                >
                  {Object.keys(labelGroups.priority).map((value) => (
                    <option key={value} value={value}>
                      {label("priority", value, locale)}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
        </div>

        <Field
          label={`${copy.checklist.notes} (${copy.form.optional})`}
          htmlFor="checklist-item-notes"
        >
          <textarea
            id="checklist-item-notes"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={item?.description ?? ""}
            className={inputClass}
          />
        </Field>

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
