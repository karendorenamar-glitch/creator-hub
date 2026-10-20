"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  createWeddingAction,
  updateWeddingAction,
  type FormState,
} from "@/app/wedding/actions";
import type { WeddingCopy } from "@/lib/wedding/copy";

const initial: FormState = null;

const fieldClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-olive-400 focus:ring-2 focus:ring-olive-100";

const labelClass = "text-sm font-medium text-ink";

export type WeddingFormValues = {
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string;
  location: string;
  estimatedGuests: string;
  totalBudget: string;
  notes?: string;
};

export function WeddingDetailsForm({
  copy,
  mode,
  values,
}: {
  copy: WeddingCopy;
  mode: "create" | "update";
  values?: WeddingFormValues;
}) {
  const action = mode === "create" ? createWeddingAction : updateWeddingAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="partnerOne" className={labelClass}>
            {copy.onboarding.partnerOne}
          </label>
          <input
            id="partnerOne"
            name="partnerOne"
            required
            maxLength={80}
            defaultValue={values?.partnerOne ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="partnerTwo" className={labelClass}>
            {copy.onboarding.partnerTwo}
          </label>
          <input
            id="partnerTwo"
            name="partnerTwo"
            required
            maxLength={80}
            defaultValue={values?.partnerTwo ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="weddingDate" className={labelClass}>
            {copy.onboarding.weddingDate}
          </label>
          <input
            id="weddingDate"
            name="weddingDate"
            type="date"
            defaultValue={values?.weddingDate ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="location" className={labelClass}>
            {copy.onboarding.location}
          </label>
          <input
            id="location"
            name="location"
            maxLength={200}
            defaultValue={values?.location ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="estimatedGuests" className={labelClass}>
            {copy.onboarding.estimatedGuests}
          </label>
          <input
            id="estimatedGuests"
            name="estimatedGuests"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={values?.estimatedGuests ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="totalBudget" className={labelClass}>
            {copy.onboarding.totalBudget}
          </label>
          <input
            id="totalBudget"
            name="totalBudget"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            defaultValue={values?.totalBudget ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      {mode === "update" ? (
        <div className="space-y-1.5">
          <label htmlFor="notes" className={labelClass}>
            {copy.settings.notes}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={2000}
            placeholder={copy.settings.notesPlaceholder}
            defaultValue={values?.notes ?? ""}
            className={fieldClass}
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-olive-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Save className="size-4" aria-hidden />
        )}
        {mode === "create"
          ? pending
            ? copy.onboarding.submitting
            : copy.onboarding.submit
          : pending
            ? copy.common.saving
            : copy.common.save}
      </button>
    </form>
  );
}
