"use client";

import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  size?: "md" | "lg" | "xl";
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  loading = false,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
        aria-label="Close overlay"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl",
          size === "md" ? "max-w-md" : size === "lg" ? "max-w-lg" : "max-w-2xl",
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative px-6 py-5">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-b-2xl bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-kefoo-600" />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 disabled:bg-slate-50 disabled:text-slate-500";

export function FormError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}
