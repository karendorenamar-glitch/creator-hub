"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { deleteTaskAction } from "@/app/wedding/(app)/checklist/actions";
import { TaskFormModal } from "@/components/wedding/checklist/task-form-modal";
import { TaskToggle } from "@/components/wedding/checklist/task-toggle";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { Badge } from "@/components/wedding/ui";
import type { ChecklistTask } from "@/lib/wedding/db-types";
import { daysFromToday, formatWeddingDate } from "@/lib/wedding/format";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const priorityTone = {
  high: "warning",
  medium: "neutral",
  low: "muted",
} as const;

const priorityRank = { high: 0, medium: 1, low: 2 } as const;

export function TaskManager({
  tasks,
  copy,
  locale,
  assignees,
}: {
  tasks: ChecklistTask[];
  copy: ModuleCopy;
  locale: "en" | "id";
  assignees: { id: string; label: string }[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistTask | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sort, setSort] = useState<"due" | "priority">("due");

  const assigneeNames = useMemo(
    () => new Map(assignees.map((person) => [person.id, person.label])),
    [assignees],
  );

  const visible = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }
      if (stageFilter !== "all" && task.stage !== stageFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "priority") {
        const byPriority =
          priorityRank[a.priority] - priorityRank[b.priority];
        if (byPriority !== 0) return byPriority;
      }
      const aDue = a.due_date ? Date.parse(a.due_date) : Number.POSITIVE_INFINITY;
      const bDue = b.due_date ? Date.parse(b.due_date) : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    });
  }, [tasks, statusFilter, priorityFilter, stageFilter, sort]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task: ChecklistTask) {
    setEditing(task);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.checklist.title}
        </h2>
        <AddButton label={copy.checklist.add} onClick={openCreate} />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={copy.checklist.status}
          className={`${inputClass} w-auto min-w-36`}
        >
          <option value="all">{copy.checklist.allStatuses}</option>
          {Object.keys(labelGroups.taskStatus).map((value) => (
            <option key={value} value={value}>
              {label("taskStatus", value, locale)}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          aria-label={copy.checklist.priority}
          className={`${inputClass} w-auto min-w-36`}
        >
          <option value="all">{copy.checklist.allPriorities}</option>
          {Object.keys(labelGroups.priority).map((value) => (
            <option key={value} value={value}>
              {label("priority", value, locale)}
            </option>
          ))}
        </select>
        <select
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value)}
          aria-label={copy.checklist.stage}
          className={`${inputClass} w-auto min-w-44`}
        >
          <option value="all">{copy.checklist.allStages}</option>
          {Object.keys(labelGroups.stage).map((value) => (
            <option key={value} value={value}>
              {label("stage", value, locale)}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as "due" | "priority")}
          aria-label={copy.checklist.dueDate}
          className={`${inputClass} w-auto min-w-36`}
        >
          <option value="due">{copy.checklist.dueDate}</option>
          <option value="priority">{copy.checklist.priority}</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.checklist.noTasks}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.checklist.emptyFilter}
        </p>
      ) : (
        <ul className="divide-y divide-olive-100 rounded-2xl border border-olive-100 bg-white">
          {visible.map((task) => {
            const days = daysFromToday(task.due_date);
            const overdue = days !== null && days < 0 && task.status !== "done";
            const done = task.status === "done";
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <TaskToggle id={task.id} completed={done} copy={copy} />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-medium ${
                        done ? "text-ink-soft line-through" : "text-ink"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">
                      {[
                        label("stage", task.stage, locale),
                        task.due_date
                          ? formatWeddingDate(task.due_date, locale)
                          : null,
                        task.assigned_to
                          ? assigneeNames.get(task.assigned_to)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={priorityTone[task.priority]}>
                    {label("priority", task.priority, locale)}
                  </Badge>
                  <Badge tone={done ? "success" : task.status === "in_progress" ? "neutral" : "muted"}>
                    {label("taskStatus", task.status, locale)}
                  </Badge>
                  {overdue ? (
                    <Badge tone="warning">{copy.checklist.overdue}</Badge>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEdit(task)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {copy.form.edit}
                  </button>
                  <DeleteForm action={deleteTaskAction} id={task.id} copy={copy} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        task={editing}
        locale={locale}
        assignees={assignees}
      />
    </div>
  );
}
