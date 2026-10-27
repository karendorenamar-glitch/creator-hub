import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-olive-400 focus:ring-2 focus:ring-olive-100";

export const labelClass = "text-sm font-medium text-ink";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function FormAlert({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;

  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm",
        error
          ? "border-rose-100 bg-rose-50 text-rose-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      {error ?? success}
    </p>
  );
}

export function ModalFooter({
  pending,
  submitLabel,
  savingLabel,
  cancelLabel,
  onCancel,
  formId,
}: {
  pending: boolean;
  submitLabel: string;
  savingLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  formId?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-olive-100 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={pending}
        className="rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? savingLabel : submitLabel}
      </button>
    </div>
  );
}

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700"
    >
      <span aria-hidden className="text-base leading-none">
        +
      </span>
      {label}
    </button>
  );
}
