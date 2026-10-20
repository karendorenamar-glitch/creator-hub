"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import {
  removeInvitationImageAction,
  uploadInvitationImageAction,
} from "@/app/wedding/(app)/invitation/actions";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function compress(file: File): Promise<File> {
  if (file.size < 1_200_000) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

export function ImageUploadField({
  field,
  label,
  currentUrl,
  copy,
}: {
  field: "cover" | "couple";
  label: string;
  currentUrl: string | null;
  copy: ModuleCopy;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick() {
    inputRef.current?.click();
  }

  async function onFile(file: File) {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError(copy.invitation.imageInvalidType);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(copy.invitation.imageTooLarge);
      return;
    }

    const compressed = await compress(file);
    const objectUrl = URL.createObjectURL(compressed);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append("field", field);
    formData.append("file", compressed, file.name);

    startTransition(async () => {
      const result = await uploadInvitationImageAction(formData);
      if (result?.error) {
        setError(result.error);
        setPreviewUrl(currentUrl);
      }
    });
  }

  function remove() {
    const formData = new FormData();
    formData.append("field", field);
    startTransition(async () => {
      await removeInvitationImageAction(formData);
      setPreviewUrl(null);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{label}</p>

      <div className="flex items-center gap-3 rounded-2xl border border-olive-100 bg-white p-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-olive-50">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={label}
              className="size-full object-cover"
            />
          ) : (
            <Upload className="size-5 text-olive-300" aria-hidden />
          )}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={pending}
            className="rounded-lg bg-olive-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-olive-700 disabled:opacity-60"
          >
            {pending
              ? copy.invitation.uploading
              : previewUrl
                ? copy.invitation.replacePhoto
                : copy.invitation.uploadPhoto}
          </button>

          {previewUrl ? (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {copy.invitation.removePhoto}
            </button>
          ) : null}

          {pending ? (
            <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {copy.invitation.uploading}
            </span>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </div>

      <p className="text-xs text-ink-soft">{copy.invitation.uploadHint}</p>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
