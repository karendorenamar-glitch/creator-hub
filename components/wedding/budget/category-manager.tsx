"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { deleteCategoryAction } from "@/app/wedding/(app)/budget/actions";
import { CategoryFormModal } from "@/components/wedding/budget/category-form-modal";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton } from "@/components/wedding/form-kit";
import type { BudgetCategory } from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function CategoryManager({
  categories,
  actualByCategory,
  copy,
}: {
  categories: BudgetCategory[];
  actualByCategory: Record<string, number>;
  copy: ModuleCopy;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetCategory | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category: BudgetCategory) {
    setEditing(category);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {copy.budget.categories}
          </h2>
          <p className="text-sm text-ink-soft">{copy.budget.categoriesHint}</p>
        </div>
        <AddButton label={copy.budget.addCategory} onClick={openCreate} />
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.budget.noCategories}
        </p>
      ) : (
        <ul className="divide-y divide-blush-100 rounded-2xl border border-blush-100 bg-white">
          {categories.map((category) => {
            const actual = actualByCategory[category.id] ?? 0;
            const difference = category.planned_amount - actual;
            return (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {copy.budget.planned}: {formatIDR(category.planned_amount)} ·{" "}
                    {copy.budget.actual}: {formatIDR(actual)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      difference < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {copy.budget.difference}: {formatIDR(difference)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {copy.form.edit}
                  </button>
                  <DeleteForm
                    action={deleteCategoryAction}
                    id={category.id}
                    copy={copy}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        category={editing}
      />
    </div>
  );
}
