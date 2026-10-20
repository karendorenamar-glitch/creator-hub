"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ExternalLink, Eye, ImageOff, Pencil } from "lucide-react";
import { deleteInspirationAction } from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { InspirationFormModal } from "@/components/wedding/inspiration/inspiration-form-modal";
import { InspirationLightbox } from "@/components/wedding/inspiration/inspiration-lightbox";
import type { InspirationItem } from "@/lib/wedding/db-types";
import { isHttpUrl } from "@/lib/wedding/validation";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

function InspirationCard({
  item,
  photos,
  imageUrls,
  copy,
  onEdit,
  onView,
}: {
  item: InspirationItem;
  photos: { id: string; path: string }[];
  imageUrls: Record<string, string>;
  copy: ModuleCopy;
  onEdit: (item: InspirationItem) => void;
  onView: (urls: string[]) => void;
}) {
  const [broken, setBroken] = useState(false);
  const safeLink = item.link_url && isHttpUrl(item.link_url) ? item.link_url : null;
  const photoUrls = photos
    .map((photo) => imageUrls[photo.path])
    .filter((url): url is string => Boolean(url));
  const mainUrl =
    photoUrls[0] ??
    (item.image_url && isHttpUrl(item.image_url) ? item.image_url : null);
  const extraCount = Math.max(0, photoUrls.length - 1);

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-olive-100 bg-white">
      {mainUrl && !broken ? (
        <div className="relative">
          <img
            src={mainUrl}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="w-full object-cover"
          />
          {extraCount > 0 ? (
            <span className="absolute right-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white">
              +{extraCount}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-olive-50 text-olive-300">
          <ImageOff className="size-8" aria-hidden />
          <span className="text-xs text-ink-soft">
            {copy.inspiration.uploadLabel}
          </span>
        </div>
      )}

      {photoUrls.length > 1 ? (
        <div className="grid grid-cols-4 gap-1 p-1">
          {photoUrls.slice(1, 5).map((url, index) => (
            <img
              key={`${item.id}-thumb-${index}`}
              src={url}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="aspect-square w-full rounded-md object-cover"
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-2 p-3">
        <p className="text-sm font-medium text-ink">{item.title}</p>
        {item.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">
            {item.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {photoUrls.length > 0 ? (
            <button
              type="button"
              onClick={() => onView(photoUrls)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-olive-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-olive-700"
            >
              <Eye className="size-3.5" aria-hidden />
              {copy.inspiration.view}
            </button>
          ) : null}
          {safeLink ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-olive-50 px-2.5 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-100"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              {copy.inspiration.openLink}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50 hover:text-ink"
          >
            <Pencil className="size-3.5" aria-hidden />
            {copy.form.edit}
          </button>
          <DeleteForm action={deleteInspirationAction} id={item.id} copy={copy} />
        </div>
      </div>
    </div>
  );
}

export function InspirationManager({
  items,
  photosByItem,
  imageUrls,
  copy,
}: {
  items: InspirationItem[];
  photosByItem: Record<string, { id: string; path: string }[]>;
  imageUrls: Record<string, string>;
  copy: ModuleCopy;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InspirationItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewer, setViewer] = useState<{
    title: string;
    urls: string[];
  } | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.category?.trim()).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? items
        : items.filter((item) => (item.category ?? "") === categoryFilter),
    [items, categoryFilter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, InspirationItem[]>();
    for (const item of filtered) {
      const key = item.category?.trim() || copy.form.none;
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, copy.form.none]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: InspirationItem) {
    setEditing(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-5">
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
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-10 text-center text-sm text-ink-soft">
          {copy.inspiration.noItems}
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-10 text-center text-sm text-ink-soft">
          {copy.inspiration.emptyFilter}
        </p>
      ) : (
        groups.map(([category, groupItems]) => (
          <section key={category} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-base font-semibold text-ink">
                {category}
              </h3>
              <span className="rounded-full bg-olive-50 px-2 py-0.5 text-xs text-olive-700">
                {groupItems.length}
              </span>
            </div>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {groupItems.map((item) => (
                <InspirationCard
                  key={item.id}
                  item={item}
                  photos={photosByItem[item.id] ?? []}
                  imageUrls={imageUrls}
                  copy={copy}
                  onEdit={openEdit}
                  onView={(urls) => setViewer({ title: item.title, urls })}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <InspirationFormModal
        key={editing?.id ?? "new-inspiration"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        item={editing}
      />

      <InspirationLightbox
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
        title={viewer?.title ?? ""}
        urls={viewer?.urls ?? []}
        copy={copy}
      />
    </div>
  );
}
