"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ImageOff,
  Images,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { AddButton } from "@/components/wedding/form-kit";
import { InspirationDetailModal } from "@/components/wedding/inspiration/inspiration-detail-modal";
import { InspirationFormModal } from "@/components/wedding/inspiration/inspiration-form-modal";
import type { InspirationItem } from "@/lib/wedding/db-types";
import { isHttpUrl } from "@/lib/wedding/validation";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const STANDARD_CATEGORIES = [
  "Dekorasi",
  "Wedding Ring",
  "MUA",
  "Gaun Pengantin",
  "Venue",
  "Undangan",
  "Fotografi",
  "Catering",
  "Busana",
  "Souvenir",
  "Entertainment",
];

function InspirationCard({
  item,
  photos,
  imageUrls,
  copy,
  onOpen,
}: {
  item: InspirationItem;
  photos: { id: string; path: string; caption: string | null }[];
  imageUrls: Record<string, string>;
  copy: ModuleCopy;
  onOpen: (item: InspirationItem) => void;
}) {
  const [broken, setBroken] = useState(false);
  const photoUrls = photos
    .map((photo) => imageUrls[photo.path])
    .filter((url): url is string => Boolean(url));
  const coverUrl = item.image_path ? imageUrls[item.image_path] : undefined;
  const galleryUrls = coverUrl
    ? [coverUrl, ...photoUrls.filter((url) => url !== coverUrl)]
    : photoUrls;
  const mainUrl =
    galleryUrls[0] ??
    (item.image_url && isHttpUrl(item.image_url) ? item.image_url : null);
  const photoCount = galleryUrls.length;
  const hasPhoto = Boolean(mainUrl) && !broken;
  const category = item.category?.trim() || copy.form.none;
  const notes = item.notes?.trim() || item.description?.trim() || null;
  const coverCaption = item.image_path
    ? (photos.find((photo) => photo.path === item.image_path)?.caption ?? null)
    : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      aria-label={`${copy.inspiration.viewDetail}: ${item.title}`}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-petal-100/80 bg-white text-left shadow-[0_22px_55px_-46px_rgba(87,66,63,0.55)] transition duration-300 hover:-translate-y-1 hover:border-petal-200 hover:shadow-[0_30px_65px_-42px_rgba(87,66,63,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-400 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-petal-50 via-cream to-olive-50">
        {hasPhoto ? (
          <img
            src={mainUrl ?? ""}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center text-ink-soft">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/75 text-petal-400 shadow-sm">
              <ImageOff className="size-5" aria-hidden />
            </span>
            <span className="text-xs">{copy.inspiration.uploadLabel}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-cocoa/75 backdrop-blur-sm">
          {category}
        </span>
        {photoCount > 1 ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            {photoCount} {copy.inspiration.photosCount}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 font-heading text-lg leading-snug text-ink">
          {item.title}
        </h3>
        {coverCaption ? (
          <p className="line-clamp-1 text-[11px] font-medium text-rosewood">
            {coverCaption}
          </p>
        ) : null}
        {notes ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">
            {notes}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-petal-100/70 pt-3 text-[11px] text-ink-soft">
          {photoCount > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Images className="size-3.5 text-petal-400" aria-hidden />
              {photoCount} {copy.inspiration.photosCount}
            </span>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-olive-700">
            {copy.inspiration.viewDetail}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}

type GalleryPhoto = {
  key: string;
  url: string;
  caption: string | null;
  item: InspirationItem;
};

function galleryPhotosForItem(
  item: InspirationItem,
  photos: { id: string; path: string; caption: string | null }[],
  imageUrls: Record<string, string>,
): GalleryPhoto[] {
  const photoUrls = photos
    .map((photo) => imageUrls[photo.path])
    .filter((url): url is string => Boolean(url));
  const coverUrl = item.image_path ? imageUrls[item.image_path] : undefined;
  const urls = coverUrl
    ? [coverUrl, ...photoUrls.filter((url) => url !== coverUrl)]
    : photoUrls.length > 0
      ? photoUrls
      : item.image_url && isHttpUrl(item.image_url)
        ? [item.image_url]
        : [];
  const captionsByPath = new Map(
    photos.map((photo) => [imageUrls[photo.path], photo.caption] as const),
  );

  return urls.map((url, index) => ({
    key: `${item.id}-${index}-${url}`,
    url,
    caption: captionsByPath.get(url) ?? null,
    item,
  }));
}

function CategoryPhotoTile({
  photo,
  copy,
  onOpen,
}: {
  photo: GalleryPhoto;
  copy: ModuleCopy;
  onOpen: (item: InspirationItem) => void;
}) {
  const [broken, setBroken] = useState(false);
  const category = photo.item.category?.trim() || copy.form.none;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(photo.item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(photo.item);
        }
      }}
      aria-label={`${copy.inspiration.viewDetail}: ${photo.item.title}`}
      className="group mb-4 break-inside-avoid cursor-pointer rounded-[1.5rem] border border-petal-100/70 bg-white p-1.5 shadow-[0_20px_50px_-45px_rgba(87,66,63,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-petal-200 hover:shadow-[0_28px_60px_-42px_rgba(87,66,63,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-400 focus-visible:ring-offset-2"
    >
      <div className="overflow-hidden rounded-[1.15rem] bg-gradient-to-br from-petal-50 via-cream to-olive-50">
        {broken ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center text-ink-soft">
            <ImageOff className="size-5 text-petal-300" aria-hidden />
            <span className="text-[11px]">{copy.inspiration.uploadLabel}</span>
          </div>
        ) : (
          <img
            src={photo.url}
            alt={photo.item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-auto w-full object-contain transition duration-500 group-hover:scale-[1.01]"
          />
        )}
      </div>
      <div className="flex items-start justify-between gap-2 px-2 pb-1 pt-2.5">
        <div className="min-w-0">
          <p className="line-clamp-1 text-xs font-medium text-ink">
            {photo.item.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            {category}
          </p>
          {photo.caption ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
              {photo.caption}
            </p>
          ) : null}
        </div>
        <ArrowUpRight
          className="mt-0.5 size-3.5 shrink-0 text-olive-600"
          aria-hidden
        />
      </div>
    </article>
  );
}

function CategoryPhotoGallery({
  photos,
  copy,
  onOpen,
}: {
  photos: GalleryPhoto[];
  copy: ModuleCopy;
  onOpen: (item: InspirationItem) => void;
}) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
      {photos.map((photo) => (
        <CategoryPhotoTile
          key={photo.key}
          photo={photo}
          copy={copy}
          onOpen={onOpen}
        />
      ))}
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
  photosByItem: Record<
    string,
    { id: string; path: string; caption: string | null }[]
  >;
  imageUrls: Record<string, string>;
  copy: ModuleCopy;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InspirationItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<InspirationItem | null>(null);

  const categoriesUsed = useMemo(() => {
    const used = items
      .map((item) => item.category?.trim())
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set(used)).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const formCategories = useMemo(
    () => Array.from(new Set([...STANDARD_CATEGORIES, ...categoriesUsed])),
    [categoriesUsed],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (
        categoryFilter !== "all" &&
        (item.category?.trim() ?? "") !== categoryFilter
      ) {
        return false;
      }
      if (!normalizedSearch) return true;

      return [
        item.title,
        item.category,
        item.notes,
        item.description,
        item.link_url,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [items, categoryFilter, normalizedSearch]);

  const categoryPhotos = useMemo(() => {
    if (categoryFilter === "all") return [];
    return filtered.flatMap((item) =>
      galleryPhotosForItem(item, photosByItem[item.id] ?? [], imageUrls),
    );
  }, [categoryFilter, filtered, imageUrls, photosByItem]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: InspirationItem) {
    setDetail(null);
    setEditing(item);
    setModalOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
  }

  const activeDetail = detail
    ? (items.find((item) => item.id === detail.id) ?? null)
    : null;

  const activePhotos = editing
    ? (photosByItem[editing.id] ?? [])
        .map((photo) => ({
          id: photo.id,
          url: imageUrls[photo.path],
          caption: photo.caption,
        }))
        .filter((photo) => Boolean(photo.url))
    : [];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-petal-500">
            <Sparkles className="size-3.5" aria-hidden />
            {copy.inspiration.pageEyebrow}
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight text-cocoa sm:text-4xl">
            {copy.inspiration.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
            {copy.inspiration.subtitle}
          </p>
        </div>
        <AddButton label={copy.inspiration.add} onClick={openCreate} />
      </div>

      <div className="rounded-[1.75rem] border border-petal-100/80 bg-white/75 p-3 shadow-[0_20px_55px_-50px_rgba(87,66,63,0.5)] backdrop-blur-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.inspiration.searchPlaceholder}
              aria-label={copy.inspiration.searchPlaceholder}
              className="w-full rounded-2xl border border-petal-100 bg-cream/70 py-3 pl-10 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-olive-300 focus:ring-2 focus:ring-olive-100"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={copy.inspiration.clearFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-soft hover:bg-olive-50 hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <p className="shrink-0 text-xs text-ink-soft">
            {categoryFilter === "all"
              ? `${filtered.length} / ${items.length}`
              : `${categoryPhotos.length} ${copy.inspiration.photosCount}`}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">
            {copy.inspiration.filterLabel}
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              categoryFilter === "all"
                ? "border-olive-600 bg-olive-600 text-white"
                : "border-petal-100 bg-white/70 text-ink-soft hover:border-olive-200 hover:text-ink"
            }`}
          >
            {copy.inspiration.allCategories}
          </button>
          {categoriesUsed.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                categoryFilter === category
                  ? "border-olive-600 bg-olive-600 text-white"
                  : "border-petal-100 bg-white/70 text-ink-soft hover:border-olive-200 hover:text-ink"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-petal-200 bg-gradient-to-br from-petal-50 via-white to-olive-50 px-6 py-14 text-center">
          <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-petal-100/60 blur-2xl" />
          <div className="relative mx-auto flex max-w-md flex-col items-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-petal-200 bg-white/80 text-petal-400 shadow-sm">
              <Images className="size-7" aria-hidden />
            </span>
            <h2 className="mt-4 font-heading text-2xl text-cocoa">
              {copy.inspiration.noItems}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {copy.inspiration.noItemsHint}
            </p>
            <div className="mt-5">
              <AddButton label={copy.inspiration.add} onClick={openCreate} />
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-petal-200 bg-white/60 px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-petal-50 text-petal-400">
            <Search className="size-5" aria-hidden />
          </span>
          <h2 className="mt-3 font-heading text-xl text-cocoa">
            {copy.inspiration.emptySearch}
          </h2>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-full border border-olive-200 px-4 py-2 text-xs font-medium text-olive-700 hover:bg-olive-50"
          >
            {copy.inspiration.clearFilters}
          </button>
        </div>
      ) : categoryFilter !== "all" ? (
        categoryPhotos.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-petal-200 bg-white/60 px-6 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-petal-50 text-petal-400">
              <Images className="size-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-heading text-xl text-cocoa">
              {copy.inspiration.noPhotosInCategory}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {copy.inspiration.noPhotosHint}
            </p>
          </div>
        ) : (
          <CategoryPhotoGallery
            photos={categoryPhotos}
            copy={copy}
            onOpen={setDetail}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((item) => (
            <InspirationCard
              key={item.id}
              item={item}
              photos={photosByItem[item.id] ?? []}
              imageUrls={imageUrls}
              copy={copy}
              onOpen={setDetail}
            />
          ))}
        </div>
      )}

      <InspirationFormModal
        key={editing?.id ?? "new-inspiration"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        item={editing}
        photos={activePhotos}
        categories={formCategories}
      />

      <InspirationDetailModal
        open={Boolean(activeDetail)}
        onClose={() => setDetail(null)}
        item={activeDetail}
        photos={activeDetail ? (photosByItem[activeDetail.id] ?? []) : []}
        imageUrls={imageUrls}
        copy={copy}
        onEdit={openEdit}
      />
    </div>
  );
}
