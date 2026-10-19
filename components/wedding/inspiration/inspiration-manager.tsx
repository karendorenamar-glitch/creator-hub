"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ExternalLink, ImageOff, Pencil, Sparkles } from "lucide-react";
import { deleteInspirationAction } from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { InspirationFormModal } from "@/components/wedding/inspiration/inspiration-form-modal";
import { Badge } from "@/components/wedding/ui";
import type { InspirationItem } from "@/lib/wedding/db-types";
import { isHttpUrl } from "@/lib/wedding/validation";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

function InspirationCard({
  item,
  copy,
  locale,
  onEdit,
}: {
  item: InspirationItem;
  copy: ModuleCopy;
  locale: "en" | "id";
  onEdit: (item: InspirationItem) => void;
}) {
  const [broken, setBroken] = useState(false);
  const safeImage =
    item.image_url && isHttpUrl(item.image_url) ? item.image_url : null;
  const safeLink = item.link_url && isHttpUrl(item.link_url) ? item.link_url : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-blush-100 bg-white">
      <div className="relative aspect-[4/3] bg-blush-50">
        {safeImage && !broken ? (
          <img
            src={safeImage}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-blush-300">
            {broken ? (
              <ImageOff className="size-8" aria-hidden />
            ) : (
              <Sparkles className="size-8" aria-hidden />
            )}
            <span className="text-xs text-ink-soft">
              {copy.inspiration.imageUrl}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3">
          <Badge tone="neutral">
            {label("inspirationCategory", item.category, locale)}
          </Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-sm font-semibold text-ink">
          {item.title}
        </h3>
        {item.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">
            {item.description}
          </p>
        ) : null}
        {item.notes ? (
          <p className="line-clamp-2 text-xs italic text-ink-soft/80">
            {item.notes}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {safeLink ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blush-50 px-2.5 py-1.5 text-xs font-medium text-blush-600 transition-colors hover:bg-blush-100"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              {copy.inspiration.openLink}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink"
          >
            <Pencil className="size-3.5" aria-hidden />
            {copy.form.edit}
          </button>
          <DeleteForm
            action={deleteInspirationAction}
            id={item.id}
            copy={copy}
          />
        </div>
      </div>
    </div>
  );
}

export function InspirationManager({
  items,
  copy,
  locale,
}: {
  items: InspirationItem[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InspirationItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? items
        : items.filter((item) => item.category === categoryFilter),
    [items, categoryFilter],
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: InspirationItem) {
    setEditing(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.inspiration.title}
        </h2>
        <AddButton label={copy.inspiration.add} onClick={openCreate} />
      </div>

      <select
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        aria-label={copy.inspiration.category}
        className={`${inputClass} w-auto min-w-44`}
      >
        <option value="all">{copy.inspiration.allCategories}</option>
        {Object.keys(labelGroups.inspirationCategory).map((value) => (
          <option key={value} value={value}>
            {label("inspirationCategory", value, locale)}
          </option>
        ))}
      </select>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.inspiration.noItems}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.inspiration.emptyFilter}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <InspirationCard
              key={item.id}
              item={item}
              copy={copy}
              locale={locale}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <InspirationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        item={editing}
        locale={locale}
      />
    </div>
  );
}
