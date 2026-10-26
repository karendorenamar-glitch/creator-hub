"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addInspirationPhotoAction,
  deleteInspirationPhotoAction,
  replaceInspirationPhotoAction,
} from "@/app/wedding/(app)/inspiration/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import type { ActionResult } from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { compressInspirationImage } from "@/lib/wedding/image-compress";
import { validateInspirationImageFile } from "@/lib/wedding/uploads";

async function preparePhoto(
  input: HTMLInputElement,
  copy: ModuleCopy,
  setError: (message: string | null) => void,
): Promise<boolean> {
  const file = input.files?.[0];
  if (!file) return false;

  const check = validateInspirationImageFile(file);
  if (!check.ok) {
    setError(
      check.error === "too_large"
        ? copy.inspiration.imageTooLarge
        : copy.inspiration.imageInvalidType,
    );
    input.value = "";
    return false;
  }

  const compressed = await compressInspirationImage(file);
  const finalCheck = validateInspirationImageFile(compressed);
  if (!finalCheck.ok) {
    setError(copy.inspiration.imageTooLarge);
    input.value = "";
    return false;
  }

  try {
    const transfer = new DataTransfer();
    transfer.items.add(compressed);
    input.files = transfer.files;
  } catch {
    // Keep the original if this browser cannot replace a FileList.
  }

  setError(null);
  return true;
}


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
      <div className="overflow-hidden rounded-xl border border-petal-100 bg-olive-50">
        <img
          src={photo.url}
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
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
              onChange={async (event) => {
                const input = event.currentTarget;
                if (await preparePhoto(input, copy, setClientError)) {
                  formRef.current?.requestSubmit();
                }
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

function AddPhotoForm({
  itemId,
  copy,
}: {
  itemId: string;
  copy: ModuleCopy;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    addInspirationPhotoAction,
    null as ActionResult,
  );
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-1">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="inline-flex cursor-pointer items-center rounded-lg bg-olive-50 px-2.5 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-100">
        {pending ? copy.form.saving : copy.inspiration.uploadLabel}
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={async (event) => {
            const input = event.currentTarget;
            if (await preparePhoto(input, copy, setClientError)) {
              formRef.current?.requestSubmit();
            }
          }}
        />
      </label>
      {clientError || state?.error ? (
        <p className="text-[11px] text-rose-600">
          {clientError ?? state?.error}
        </p>
      ) : null}
    </form>
  );
}

export function InspirationPhotoManager({
  itemId,
  photos,
  copy,
}: {
  itemId: string | null;
  photos: { id: string; url: string }[];
  copy: ModuleCopy;
}) {
  if (!itemId && photos.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-petal-100/80 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
          {copy.inspiration.currentPhotos}
        </p>
        {itemId ? <AddPhotoForm itemId={itemId} copy={copy} /> : null}
      </div>
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <PhotoRow key={photo.id} photo={photo} copy={copy} />
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-ink-soft">{copy.inspiration.uploadHint}</p>
    </div>
  );
}
