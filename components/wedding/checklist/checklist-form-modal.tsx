"use client";

import { useActionState, useEffect } from "react";
import {
  createChecklistAction,
  renameChecklistAction,
} from "@/app/wedding/(app)/checklist/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { Checklist } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function ChecklistFormModal({
  open,
  onClose,
  copy,
  checklist,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  checklist: Checklist | null;
}) {
  const action = checklist ? renameChecklistAction : createChecklistAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        checklist ? copy.checklist.renameChecklist : copy.checklist.newChecklist
      }
    >
      <form action={formAction} className="space-y-4">
        {checklist ? <input type="hidden" name="id" value={checklist.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.checklist.checklistName} htmlFor="checklist-title">
          <input
            id="checklist-title"
            name="title"
            required
            maxLength={120}
            defaultValue={checklist?.title ?? ""}
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
