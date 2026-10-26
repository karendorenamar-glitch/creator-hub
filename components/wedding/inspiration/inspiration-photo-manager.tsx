"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useRef, useState } from "react";
import {
  deleteInspirationPhotoAction,
  replaceInspirationPhotoAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import type { ActionResult } from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { validateInspirationImageFile } from "@/lib/wedding/uploads";

function PhotoRow({
  photo,
  copy,
}: {
  photo: { id: string; url: string };
  copy: ModuleCopy;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    replaceInspirationPhotoAction,
    null as ActionResult,
  );
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <div className="overflow-hidden rounded-lg border border-olive-100 bg-olive-50">
        <img
          src={photo.url}
          alt=""
          loading="lazy"
          className="h-20 w-full object-contain"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="id" value={photo.id} />
          <label className="cursor-pointer rounded-lg bg-olive-50 px-2 py-1 text-xs font-medium text-olive-700 hover:bg-olive-100">
            {pending ? copy.form.saving : copy.inspiration.replace}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                const check = validateInspirationImageFile(file);
                if (!check.ok) {
                  setClientError(
                    check.error === "too_large"
                      ? copy.inspiration.imageTooLarge
                      : copy.inspiration.imageInvalidType,
                  );
                  event.currentTarget.value = "";
                  return;
                }
                setClientError(null);
                formRef.current?.requestSubmit();
              }}
            />
          </label>
        </form>
        <DeleteForm
          action={deleteInspirationPhotoAction}
          id={photo.id}
          copy={copy}
        />
      </div>
      {clientError || state?.error ? (
        <p className="text-[11px] text-rose-600">
          {clientError ?? state?.error}
        </p>
      ) : null}
    </div>
  );
}

export function InspirationPhotoManager({
  photos,
  copy,
}: {
  photos: { id: string; url: string }[];
  copy: ModuleCopy;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="space-y-2 rounded-2xl border border-olive-100 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
        {copy.inspiration.currentPhotos}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo) => (
          <PhotoRow key={photo.id} photo={photo} copy={copy} />
        ))}
      </div>
    </div>
  );
}
