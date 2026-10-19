"use client";

import { useActionState, useEffect } from "react";
import {
  createTaskAction,
  updateTaskAction,
} from "@/app/wedding/(app)/checklist/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { ChecklistTask } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function TaskFormModal({
  open,
  onClose,
  copy,
  task,
  locale,
  assignees,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  task: ChecklistTask | null;
  locale: "en" | "id";
  assignees: { id: string; label: string }[];
}) {
  const action = task ? updateTaskAction : createTaskAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={task ? copy.checklist.edit : copy.checklist.add}
    >
      <form action={formAction} className="space-y-4">
        {task ? <input type="hidden" name="id" value={task.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.checklist.taskTitle} htmlFor="task-title">
          <input
            id="task-title"
            name="title"
            required
            maxLength={160}
            defaultValue={task?.title ?? ""}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.checklist.stage} htmlFor="task-stage">
            <select
              id="task-stage"
              name="stage"
              defaultValue={task?.stage ?? "planning"}
              className={inputClass}
            >
              {Object.keys(labelGroups.stage).map((value) => (
                <option key={value} value={value}>
                  {label("stage", value, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.checklist.priority} htmlFor="task-priority">
            <select
              id="task-priority"
              name="priority"
              defaultValue={task?.priority ?? "medium"}
              className={inputClass}
            >
              {Object.keys(labelGroups.priority).map((value) => (
                <option key={value} value={value}>
                  {label("priority", value, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.checklist.status} htmlFor="task-status">
            <select
              id="task-status"
              name="status"
              defaultValue={task?.status ?? "todo"}
              className={inputClass}
            >
              {Object.keys(labelGroups.taskStatus).map((value) => (
                <option key={value} value={value}>
                  {label("taskStatus", value, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.checklist.dueDate} htmlFor="task-due">
            <input
              id="task-due"
              name="dueDate"
              type="date"
              defaultValue={task?.due_date ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={copy.checklist.assignedTo} htmlFor="task-assignee">
            <select
              id="task-assignee"
              name="assignedTo"
              defaultValue={task?.assigned_to ?? ""}
              className={inputClass}
            >
              <option value="">{copy.checklist.unassigned}</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label={`${copy.checklist.description} (${copy.form.optional})`}
          htmlFor="task-description"
        >
          <textarea
            id="task-description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={task?.description ?? ""}
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
