"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Lock, Pencil, Plus } from "lucide-react";
import {
  deleteChecklistAction,
  deleteChecklistItemAction,
  moveChecklistItemAction,
} from "@/app/wedding/(app)/checklist/actions";
import { ChecklistFormModal } from "@/components/wedding/checklist/checklist-form-modal";
import { ChecklistItemFormModal } from "@/components/wedding/checklist/checklist-item-form-modal";
import { TaskToggle } from "@/components/wedding/checklist/task-toggle";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton } from "@/components/wedding/form-kit";
import { Badge, Card, Progress } from "@/components/wedding/ui";
import { checklistProgress } from "@/lib/wedding/checklist-progress";
import type { Checklist, ChecklistTask } from "@/lib/wedding/db-types";
import { formatWeddingDate } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

type ChecklistWithItems = Checklist & { items: ChecklistTask[] };

function MoveItemButton({
  id,
  direction,
  label,
}: {
  id: string;
  direction: "up" | "down";
  label: string;
}) {
  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) =>
      moveChecklistItemAction(formData),
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg p-1 text-ink-soft hover:bg-olive-50 disabled:opacity-40"
        aria-label={label}
        title={label}
      >
        {direction === "up" ? (
          <ArrowUp className="size-3.5" aria-hidden />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden />
        )}
      </button>
    </form>
  );
}

export function ChecklistBoard({
  checklists,
  copy,
  locale,
}: {
  checklists: ChecklistWithItems[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [checklistModal, setChecklistModal] = useState<{
    open: boolean;
    editing: Checklist | null;
  }>({ open: false, editing: null });
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    checklist: Checklist | null;
    item: ChecklistTask | null;
  }>({ open: false, checklist: null, item: null });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {copy.checklist.title}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            {copy.checklist.templateDisclaimer}
          </p>
        </div>
        <AddButton
          label={copy.checklist.addChecklist}
          onClick={() => setChecklistModal({ open: true, editing: null })}
        />
      </div>

      {checklists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.checklist.emptyChecklists}
        </p>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const builtin = checklist.kind === "builtin_kua";
            const { done, total, percentage } = checklistProgress(
              checklist.items,
            );
            const groups = new Map<string, ChecklistTask[]>();
            for (const item of checklist.items) {
              const key = item.group_name ?? "";
              const bucket = groups.get(key) ?? [];
              bucket.push(item);
              groups.set(key, bucket);
            }

            return (
              <Card key={checklist.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-semibold text-ink">
                        {checklist.title}
                      </h3>
                      <Badge tone={builtin ? "neutral" : "muted"}>
                        {builtin
                          ? copy.checklist.builtinBadge
                          : copy.checklist.customBadge}
                      </Badge>
                      {builtin ? (
                        <Lock className="size-3.5 text-ink-soft" aria-hidden />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {copy.checklist.progress
                        .replace("{done}", String(done))
                        .replace("{total}", String(total))}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!builtin ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setChecklistModal({
                              open: true,
                              editing: checklist,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          {copy.checklist.renameChecklist}
                        </button>
                        <DeleteForm
                          action={deleteChecklistAction}
                          id={checklist.id}
                          copy={copy}
                          confirmMessage={copy.checklist.deleteChecklistConfirm}
                        />
                      </>
                    ) : null}
                  </div>
                </div>

                <Progress value={percentage} />

                <div className="space-y-4">
                  {Array.from(groups.entries()).map(([group, items]) =>
                    items.length === 0 ? null : (
                      <div key={group || "items"} className="space-y-1">
                        {group ? (
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                            {group}
                          </p>
                        ) : null}
                        <ul className="divide-y divide-olive-100 rounded-xl border border-olive-100 bg-white">

                          {items.map((item) => (
                            <li
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                            >
                              <div className="flex min-w-0 items-start gap-2">
                                <TaskToggle
                                  id={item.id}
                                  completed={item.status === "done"}
                                  copy={copy}
                                />
                                <div className="min-w-0">
                                  <p
                                    className={`text-sm ${
                                      item.status === "done"
                                        ? "text-ink-soft line-through"
                                        : "text-ink"
                                    }`}
                                  >
                                    {item.title}
                                  </p>
                                  {item.due_date ? (
                                    <p className="mt-0.5 text-xs text-ink-soft">
                                      {formatWeddingDate(item.due_date, locale)}
                                    </p>
                                  ) : null}
                                  {item.description ? (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
                                      {item.description}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!builtin ? (
                                  <>
                                    <MoveItemButton
                                      id={item.id}
                                      direction="up"
                                      label={copy.checklist.moveUp}
                                    />
                                    <MoveItemButton
                                      id={item.id}
                                      direction="down"
                                      label={copy.checklist.moveDown}
                                    />
                                  </>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemModal({
                                      open: true,
                                      checklist,
                                      item,
                                    })
                                  }
                                  className="rounded-lg p-1.5 text-ink-soft hover:bg-olive-50"
                                  aria-label={copy.checklist.editItem}
                                  title={copy.checklist.editItem}
                                >
                                  <Pencil className="size-3.5" aria-hidden />
                                </button>
                                {!builtin && !item.is_required ? (
                                  <DeleteForm
                                    action={deleteChecklistItemAction}
                                    id={item.id}
                                    copy={copy}
                                  />
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>

                {!builtin ? (
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({
                        open: true,
                        checklist,
                        item: null,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-olive-50 px-3 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-100"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    {copy.checklist.addItem}
                  </button>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <ChecklistFormModal
        key={checklistModal.editing?.id ?? "new-checklist"}
        open={checklistModal.open}
        onClose={() => setChecklistModal({ open: false, editing: null })}
        copy={copy}
        checklist={checklistModal.editing}
      />

      {itemModal.checklist ? (
        <ChecklistItemFormModal
          key={itemModal.item?.id ?? `new-${itemModal.checklist.id}`}
          open={itemModal.open}
          onClose={() =>
            setItemModal({ open: false, checklist: null, item: null })
          }
          copy={copy}
          locale={locale}
          checklist={itemModal.checklist}
          item={itemModal.item}
        />
      ) : null}
    </div>
  );
}
