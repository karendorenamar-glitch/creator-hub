"use client";
/* eslint-disable @next/next/no-img-element */

import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addInspirationPhotoAction,
  deleteInspirationPhotoAction,
  replaceInspirationPhotoAction,
  updateInspirationPhotoCaptionAction,
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
  photo: { id: string; url: string; caption: string | null };
  copy: ModuleCopy;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    replaceInspirationPhotoAction,
    null as ActionResult,
  );
  const [captionState, captionAction, captionPending] = useActionState(
    updateInspirationPhotoCaptionAction,
    null as ActionResult,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

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
      <form action={captionAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={photo.id} />
        <input
          name="caption"
          maxLength={120}
          defaultValue={photo.caption ?? ""}
          placeholder={copy.inspiration.photoCaptionPlaceholder}
          aria-label={copy.inspiration.photoCaption}
          className="min-w-0 flex-1 rounded-lg border border-olive-100 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-olive-300"
        />
        <button
          type="submit"
          disabled={captionPending}
          className="rounded-lg bg-olive-50 px-2 py-1 text-[11px] font-medium text-olive-700 hover:bg-olive-100 disabled:opacity-60"
        >
          {captionPending ? copy.form.saving : copy.form.save}
        </button>
      </form>
      {captionState?.error ? (
        <p className="text-[10px] text-rose-600">{captionState.error}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-1">
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="id" value={photo.id} />
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-olive-50 px-2 py-1 text-xs font-medium text-olive-700 hover:bg-olive-100 ${preparing || pending ? "pointer-events-none opacity-60" : ""}`}>
            {preparing || pending ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : null}
            {preparing
              ? copy.inspiration.preparing
              : pending
                ? copy.inspiration.uploading
                : copy.inspiration.replace}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={async (event) => {
                const input = event.currentTarget;
                setPreparing(true);
                setClientError(null);
                try {
                  if (await preparePhoto(input, copy, setClientError)) {
                    formRef.current?.requestSubmit();
                  }
                } finally {
                  setPreparing(false);
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
  const [preparing, setPreparing] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      // The form input was reset above; clear the label as part of the same
      // external form synchronization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFileLabel(null);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input
        name="caption"
        maxLength={120}
        placeholder={copy.inspiration.photoCaptionPlaceholder}
        aria-label={copy.inspiration.photoCaption}
        className="w-full rounded-xl border border-petal-100 bg-cream/70 px-3 py-2 text-xs text-ink outline-none focus:border-olive-300"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-olive-50 px-2.5 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-100 ${preparing || pending ? "pointer-events-none opacity-60" : ""}`}>
          {preparing ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : null}
          {preparing ? copy.inspiration.preparing : copy.inspiration.addPhoto}
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={async (event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              setPreparing(true);
              setClientError(null);
              setFileLabel(null);
              try {
                if (await preparePhoto(input, copy, setClientError)) {
                  setFileLabel(file?.name ?? null);
                }
              } finally {
                setPreparing(false);
              }
            }}
          />
        </label>
        <button
          type="submit"
          disabled={pending || preparing || !fileLabel}
          className="inline-flex items-center gap-1.5 rounded-lg bg-olive-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending || preparing ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : null}
          {preparing
            ? copy.inspiration.preparing
            : pending
              ? copy.inspiration.uploading
              : copy.inspiration.uploadPhoto}
        </button>
      </div>
      {fileLabel ? (
        <p className="max-w-full truncate text-[11px] text-ink-soft" aria-live="polite">
          {fileLabel}
        </p>
      ) : null}
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
  photos: { id: string; url: string; caption: string | null }[];
  copy: ModuleCopy;
}) {
  if (!itemId && photos.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-petal-100/80 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
          {copy.inspiration.photoSection}
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
