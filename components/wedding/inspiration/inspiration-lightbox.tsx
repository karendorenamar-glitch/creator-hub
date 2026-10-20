"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function InspirationLightbox({
  open,
  onClose,
  title,
  urls,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  urls: string[];
  copy: ModuleCopy;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % urls.length);
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + urls.length) % urls.length);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, urls.length]);

  if (!open || typeof document === "undefined" || urls.length === 0) {
    return null;
  }

  const current = Math.min(index, urls.length - 1);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-ink/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-white/70">
            {current + 1} / {urls.length} {copy.inspiration.photosCount}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.form.close}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-3 pb-3">
        {urls.length > 1 ? (
          <button
            type="button"
            onClick={() =>
              setIndex((index - 1 + urls.length) % urls.length)
            }
            aria-label="Previous photo"
            className="absolute left-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:left-6"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
        ) : null}

        <img
          src={urls[current]}
          alt={`${title} ${current + 1}`}
          className="max-h-full max-w-full rounded-xl object-contain"
        />

        {urls.length > 1 ? (
          <button
            type="button"
            onClick={() => setIndex((index + 1) % urls.length)}
            aria-label="Next photo"
            className="absolute right-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:right-6"
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        ) : null}
      </div>

      {urls.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {urls.map((url, thumbIndex) => (
            <button
              key={`${url}-${thumbIndex}`}
              type="button"
              onClick={() => setIndex(thumbIndex)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                thumbIndex === current ? "border-white" : "border-transparent"
              }`}
            >
              <img
                src={url}
                alt=""
                className="size-16 object-cover opacity-80 hover:opacity-100"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
