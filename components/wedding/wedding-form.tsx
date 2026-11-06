"use client";

import { MALAYSIA_STATES } from "@/lib/wedding/marriage-templates";
import { COUNTRIES } from "@/lib/wedding/countries";
import { CurrencyField } from "@/components/wedding/currency-field";
import { useMoney } from "@/components/wedding/currency-provider";
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
  totalBudget: number;
  stateCode?: string | null;
  partnerNationality?: string | null;
  notes?: string;
};

export function WeddingDetailsForm({
  copy,
  mode,
  values,
  next,
  refCode,
  country,
}: {
  copy: WeddingCopy;
  mode: "create" | "update";
  values?: WeddingFormValues;
  next?: string;
  refCode?: string;
  country?: string | null;
}) {
  const money = useMoney();
  const action = mode === "create" ? createWeddingAction : updateWeddingAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-5">
      <CurrencyField />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}
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
            {`${copy.onboarding.totalBudget
              .replace(" (IDR)", "")
              .replace("(IDR)", "")
              .trim()} (${money.currency})`}
          </label>
          <input
            id="totalBudget"
            name="totalBudget"
            type="number"
            min={0}
            step={money.currency === "IDR" || money.currency === "JPY" ? 1000 : 0.01}
            inputMode="decimal"
            defaultValue={
              values?.totalBudget !== undefined
                ? money.toInput(values.totalBudget)
                : ""
            }
            className={fieldClass}
          />
        </div>
      </div>

      {country === "MY" ? (
        <div className="space-y-1.5">
          <label htmlFor="stateCode" className={labelClass}>
            Negeri Tempat Permohonan Nikah
          </label>
          <select
            id="stateCode"
            name="stateCode"
            defaultValue={values?.stateCode ?? ""}
            className={fieldClass}
          >
            <option value="">Sila pilih negeri</option>
            {MALAYSIA_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <p className="text-xs leading-relaxed text-ink-soft">
            Digunakan untuk menyediakan checklist urusan perkahwinan negeri anda.
          </p>
        </div>
      ) : null}

      {country === "MY" ? (
        <div className="space-y-1.5">
          <label htmlFor="partnerNationality" className={labelClass}>
            Partner&apos;s Nationality / Kewarganegaraan Pasangan
          </label>
          <select
            id="partnerNationality"
            name="partnerNationality"
            defaultValue={values?.partnerNationality ?? ""}
            className={fieldClass}
          >
            <option value="">Belum diisi</option>
            <option value="MY">Malaysian</option>
            <option value="ID">Indonesian</option>
            {COUNTRIES.filter((item) =>
              ["SG", "US", "GB", "AU"].includes(item.code),
            ).map((item) => (
              <option key={item.code} value={item.code}>
                Other — {item.name}
              </option>
            ))}
          </select>
          <p className="text-xs leading-relaxed text-ink-soft">
            Menentukan sama ada dokumen pasangan warga asing diperlukan.
          </p>
        </div>
      ) : null}

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
