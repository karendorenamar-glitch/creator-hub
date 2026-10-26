import { TaskToggle } from "@/components/wedding/checklist/task-toggle";
import { Badge, Card } from "@/components/wedding/ui";
import type { Checklist, ChecklistTask } from "@/lib/wedding/db-types";
import { formatWeddingDate } from "@/lib/wedding/format";
import { label } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function TimelineList({
  tasks,
  checklists,
  copy,
  locale,
}: {
  tasks: ChecklistTask[];
  checklists: Checklist[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const names = new Map(checklists.map((checklist) => [checklist.id, checklist.title]));

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.checklist.timeline}
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          {copy.checklist.templateDisclaimer}
        </p>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-6 text-center text-sm text-ink-soft">
          {copy.checklist.timelineEmpty}
        </p>
      ) : (
        <ul className="divide-y divide-olive-100 rounded-2xl border border-olive-100 bg-white">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                <TaskToggle
                  id={task.id}
                  completed={task.status === "done"}
                  copy={copy}
                />
                <div className="min-w-0">
                  <p
                    className={`text-sm ${
                      task.status === "done"
                        ? "text-ink-soft line-through"
                        : "text-ink"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {task.due_date
                      ? formatWeddingDate(task.due_date, locale)
                      : ""}
                    {task.checklist_id
                      ? ` · ${names.get(task.checklist_id) ?? ""}`
                      : ""}
                  </p>
                </div>
              </div>
              <Badge tone={task.status === "done" ? "success" : "muted"}>
                {label("taskStatus", task.status, locale)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
