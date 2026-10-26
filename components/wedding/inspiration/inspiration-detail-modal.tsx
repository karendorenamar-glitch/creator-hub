"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { deleteInspirationAction } from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { FormModal } from "@/components/wedding/form-modal";
import { InspirationLightbox } from "@/components/wedding/inspiration/inspiration-lightbox";
import { InspirationVendorOptions } from "@/components/wedding/inspiration/inspiration-vendor-options";
import type {
  InspirationItem,
  InspirationVendorOption,
} from "@/lib/wedding/db-types";
import { isHttpUrl } from "@/lib/wedding/validation";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function InspirationDetailModal({
  open,
  onClose,
  item,
  photos,
  options,
  imageUrls,
  copy,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  item: InspirationItem | null;
  photos: { id: string; path: string }[];
  options: InspirationVendorOption[];
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
  const galleryUrls = coverUrl
    ? [coverUrl, ...photoUrls.filter((url) => url !== coverUrl)]
    : photoUrls;
  const safeLink =
    item.link_url && isHttpUrl(item.link_url) ? item.link_url : null;

  return (
    <>
      <FormModal open={open} onClose={onClose} wide title={copy.inspiration.detailTitle}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-ink">
                {item.title}
              </h2>
              {item.category ? (
                <p className="mt-1 text-sm text-ink-soft">{item.category}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-olive-50 px-3 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-100"
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

          {galleryUrls.length > 0 ? (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-2xl border border-olive-100 bg-olive-50/60">
                <img
                  src={galleryUrls[0]}
                  alt={item.title}
                  className="max-h-[28rem] w-full object-contain"
                />
              </div>
              {galleryUrls.length > 1 ? (
                <div className="grid grid-cols-4 gap-2">
                  {galleryUrls.slice(1).map((url, index) => (
                    <button
                      key={`${item.id}-detail-${index}`}
                      type="button"
                      onClick={() => setViewer({ title: item.title, urls: galleryUrls })}
                      className="overflow-hidden rounded-lg border border-olive-100 bg-olive-50"
                    >
                      <img
                        src={url}
                        alt=""
                        className="aspect-square w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setViewer({ title: item.title, urls: galleryUrls })}
                className="text-xs font-medium text-olive-700 hover:underline"
              >
                {copy.inspiration.view}
              </button>
            </div>
          ) : null}

          {item.notes ?? item.description ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
                {copy.inspiration.notes}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {item.notes ?? item.description}
              </p>
            </div>
          ) : null}

          {safeLink ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden />
              {copy.inspiration.openLink}
            </a>
          ) : null}

          <InspirationVendorOptions
            itemId={item.id}
            options={options}
            copy={copy}
          />
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
