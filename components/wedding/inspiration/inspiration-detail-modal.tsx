"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ExternalLink, ImageOff, Images, Pencil } from "lucide-react";
import { deleteInspirationAction } from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { FormModal } from "@/components/wedding/form-modal";
import { InspirationLightbox } from "@/components/wedding/inspiration/inspiration-lightbox";
import type { InspirationItem } from "@/lib/wedding/db-types";
import { isHttpUrl } from "@/lib/wedding/validation";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function InspirationDetailModal({
  open,
  onClose,
  item,
  photos,
  imageUrls,
  copy,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  item: InspirationItem | null;
  photos: { id: string; path: string }[];
  imageUrls: Record<string, string>;
  copy: ModuleCopy;
  onEdit: (item: InspirationItem) => void;
}) {
  const [viewer, setViewer] = useState<{
    title: string;
    urls: string[];
  } | null>(null);

  if (!item) return null;

  const photoUrls = photos
    .map((photo) => imageUrls[photo.path])
    .filter((url): url is string => Boolean(url));
  const coverUrl = item.image_path ? imageUrls[item.image_path] : undefined;
  const externalUrl =
    item.image_url && isHttpUrl(item.image_url) ? item.image_url : null;
  const galleryUrls = coverUrl
    ? [coverUrl, ...photoUrls.filter((url) => url !== coverUrl)]
    : photoUrls.length > 0
      ? photoUrls
      : externalUrl
        ? [externalUrl]
        : [];
  const notes = item.notes?.trim() || item.description?.trim() || null;
  const category = item.category?.trim() || null;
  const safeLink =
    item.link_url && isHttpUrl(item.link_url) ? item.link_url : null;

  return (
    <>
      <FormModal
        open={open}
        onClose={onClose}
        extraWide
        title={copy.inspiration.detailTitle}
      >
        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-3">
            {galleryUrls.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewer({ title: item.title, urls: galleryUrls })}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-petal-100 bg-gradient-to-br from-petal-50/70 to-olive-50/40 text-left"
                >
                  <img
                    src={galleryUrls[0]}
                    alt={item.title}
                    className="max-h-[34rem] min-h-72 w-full object-contain transition duration-500 group-hover:scale-[1.01]"
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-ink/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    {copy.inspiration.view}
                  </span>
                </button>

                {galleryUrls.length > 1 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {galleryUrls.slice(1).map((url, index) => (
                      <button
                        key={`${item.id}-detail-${index}`}
                        type="button"
                        onClick={() => setViewer({ title: item.title, urls: galleryUrls })}
                        className="overflow-hidden rounded-xl border border-petal-100 bg-olive-50/50 transition-colors hover:border-olive-300"
                      >
                        <img
                          src={url}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-petal-200 bg-petal-50/50 px-6 text-center text-ink-soft">
                <ImageOff className="size-7 text-petal-300" aria-hidden />
                <p className="text-sm">{copy.inspiration.uploadLabel}</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {category ? (
                  <span className="rounded-full border border-petal-200 bg-petal-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-rosewood">
                    {category}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                  <Images className="size-3.5 text-petal-400" aria-hidden />
                  {galleryUrls.length} {copy.inspiration.photosCount}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-olive-50 px-3 py-2 text-xs font-medium text-olive-700 hover:bg-olive-100"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {copy.form.edit}
                </button>
                <DeleteForm
                  action={deleteInspirationAction}
                  id={item.id}
                  copy={copy}
                  label={copy.inspiration.deleteInspiration}
                />
              </div>
            </div>

            <h2 className="font-heading text-3xl leading-tight text-cocoa">
              {item.title}
            </h2>

            {notes ? (
              <div className="rounded-2xl border border-petal-100/80 bg-cream/80 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                  {copy.inspiration.notes}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {notes}
                </p>
              </div>
            ) : null}

            {safeLink ? (
              <a
                href={safeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-olive-200 px-3.5 py-2.5 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50"
              >
                <ExternalLink className="size-4" aria-hidden />
                {copy.inspiration.openLink}
              </a>
            ) : null}
          </div>
        </div>
      </FormModal>

      <InspirationLightbox
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
        title={viewer?.title ?? ""}
        urls={viewer?.urls ?? []}
        copy={copy}
      />
    </>
  );
}
