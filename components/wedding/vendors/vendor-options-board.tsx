"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Heart,
  Pencil,
  Plus,
  Sparkles,
  TableProperties,
} from "lucide-react";
import {
  createVendorOptionAction,
  deleteVendorOptionAction,
  updateVendorOptionAction,
} from "@/app/wedding/(app)/vendors/option-actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge, Card } from "@/components/wedding/ui";
import type { VendorOption } from "@/lib/wedding/db-types";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import {
  VENDOR_OPTION_CATEGORIES,
  VENDOR_OPTION_LIMIT,
} from "@/lib/wedding/vendor-options";

function OptionFormModal({
  open,
  onClose,
  copy,
  option,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  option: VendorOption | null;
  categories: string[];
}) {
  const action = option ? updateVendorOptionAction : createVendorOptionAction;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={option ? copy.vendors.optionEdit : copy.vendors.optionAdd}
    >
      <form action={formAction} className="space-y-4">
        {option ? <input type="hidden" name="id" value={option.id} /> : null}
        <FormAlert error={state?.error} />

        <p className="rounded-xl border border-petal-100 bg-petal-50/50 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {copy.vendors.optionFormHint}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.vendors.optionCategory} htmlFor="option-category">
            <select
              id="option-category"
              name="category"
              defaultValue={option?.category ?? "Venue"}
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <Field label={copy.vendors.name} htmlFor="option-vendor-name">
            <input
              id="option-vendor-name"
              name="vendorName"
              required
              maxLength={120}
              defaultValue={option?.vendor_name ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={`${copy.vendors.optionInstagram} (${copy.form.optional})`}
            htmlFor="option-instagram"
          >
            <input
              id="option-instagram"
              name="instagramUrl"
              type="url"
              inputMode="url"
              placeholder="https://instagram.com/..."
              maxLength={1000}
              defaultValue={option?.instagram_url ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label={`${copy.vendors.optionPrice} (${copy.form.optional})`}
            htmlFor="option-price"
            hint={copy.vendors.optionPriceHint}
          >
            <input
              id="option-price"
              name="referencePrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={option?.reference_price ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label={copy.vendors.optionLove}
          htmlFor="option-love"
          hint={copy.vendors.optionLoveHint}
        >
          <textarea
            id="option-love"
            name="loveReason"
            rows={3}
            maxLength={2000}
            defaultValue={option?.love_reason ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label={copy.vendors.optionHesitation}
          htmlFor="option-hesitation"
          hint={copy.vendors.optionHesitationHint}
        >
          <textarea
            id="option-hesitation"
            name="hesitation"
            rows={3}
            maxLength={2000}
            defaultValue={option?.hesitation ?? ""}
            className={inputClass}
          />
        </Field>

        <ModalFooter
          pending={pending}
          submitLabel={copy.form.save}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}

export function VendorOptionsBoard({
  options,
  copy,
  schemaReady,
}: {
  options: VendorOption[];
  copy: ModuleCopy;
  schemaReady: boolean;
}) {
  const [modal, setModal] = useState<{
    open: boolean;
    editing: VendorOption | null;
  }>({ open: false, editing: null });

  const formCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...VENDOR_OPTION_CATEGORIES,
          ...options.map((option) => option.category),
        ]),
      ),
    [options],
  );

  const groups = useMemo(() => {
    const map = new Map<string, VendorOption[]>();
    for (const option of options) {
      const bucket = map.get(option.category) ?? [];
      bucket.push(option);
      map.set(option.category, bucket);
    }
    const known = VENDOR_OPTION_CATEGORIES as readonly string[];
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = known.indexOf(a);
      const bi = known.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [options]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-petal-500">
            <Sparkles className="size-3.5" aria-hidden />
            {copy.vendors.optionTitle}
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight text-cocoa sm:text-4xl">
            {copy.vendors.optionTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
            {copy.vendors.optionSubtitle}
          </p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-soft">
            {copy.vendors.optionCompareHint}
          </p>
        </div>
        {schemaReady ? (
          <button
            type="button"
            onClick={() => setModal({ open: true, editing: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700"
          >
            <Plus className="size-4" aria-hidden />
            {copy.vendors.optionAdd}
          </button>
        ) : null}
      </div>

      {!schemaReady ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <p className="text-sm font-medium text-amber-900">
            {copy.vendors.optionMigrationRequired}
          </p>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="border-dashed border-petal-200 bg-gradient-to-br from-petal-50 via-white to-olive-50 py-12 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-petal-200 bg-white text-petal-400">
            <Heart className="size-7" aria-hidden />
          </span>
          <h2 className="mt-4 font-heading text-2xl text-cocoa">
            {copy.vendors.optionEmpty}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            {copy.vendors.optionEmptyHint}
          </p>
          <button
            type="button"
            onClick={() => setModal({ open: true, editing: null })}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
          >
            <Plus className="size-4" aria-hidden />
            {copy.vendors.optionAdd}
          </button>
        </Card>
      ) : (
        <div className="space-y-7">
          {groups.map(([category, candidates]) => (
            <section key={category} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-heading text-xl text-cocoa">
                  <TableProperties className="size-4 text-petal-400" aria-hidden />
                  {category}
                </h2>
                <span className="rounded-full bg-petal-50 px-2.5 py-1 text-xs text-rosewood">
                  {candidates.length} / {VENDOR_OPTION_LIMIT}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-petal-100 bg-white">
                <table
                  className="w-full border-collapse text-left text-sm"
                  style={{ minWidth: `${Math.max(680, 220 + candidates.length * 210)}px` }}
                >
                  <thead>
                    <tr className="border-b border-petal-100 bg-cream/80">
                      <th className="sticky left-0 z-10 w-36 bg-cream/95 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
                        {copy.vendors.optionInformation}
                      </th>
                      {candidates.map((candidate) => (
                        <th
                          key={candidate.id}
                          className="min-w-52 border-l border-petal-100 px-4 py-3 align-top"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-heading text-base text-ink">
                              {candidate.vendor_name}
                            </span>
                            {candidate.selected_vendor_id ? (
                              <Badge tone="success">{copy.vendors.optionSelected}</Badge>
                            ) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-petal-100">
                    <tr>
                      <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-medium text-ink-soft">
                        {copy.vendors.name}
                      </th>
                      {candidates.map((candidate) => (
                        <td key={candidate.id} className="border-l border-petal-100 px-4 py-3 text-sm text-ink">
                          {candidate.vendor_name}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-medium text-ink-soft">
                        Instagram
                      </th>
                      {candidates.map((candidate) => (
                        <td key={candidate.id} className="border-l border-petal-100 px-4 py-3 text-xs">
                          {candidate.instagram_url ? (
                            <a
                              href={candidate.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-olive-700 hover:underline"
                            >
                              <ExternalLink className="size-3" aria-hidden />
                              {copy.vendors.compare}
                            </a>
                          ) : (
                            <span className="text-ink-soft">{copy.form.none}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-medium text-ink-soft">
                        {copy.vendors.optionPrice}
                      </th>
                      {candidates.map((candidate) => (
                        <td key={candidate.id} className="border-l border-petal-100 px-4 py-3 text-sm font-medium text-ink">
                          {candidate.reference_price !== null
                            ? formatIDR(candidate.reference_price)
                            : copy.vendors.optionPriceEmpty}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-medium text-ink-soft">
                        {copy.vendors.optionLove}
                      </th>
                      {candidates.map((candidate) => (
                        <td key={candidate.id} className="border-l border-petal-100 px-4 py-3 text-xs leading-relaxed text-ink">
                          {candidate.love_reason || copy.form.none}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-medium text-ink-soft">
                        {copy.vendors.optionHesitation}
                      </th>
                      {candidates.map((candidate) => (
                        <td key={candidate.id} className="border-l border-petal-100 px-4 py-3 text-xs leading-relaxed text-ink">
                          {candidate.hesitation || copy.form.none}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-medium text-ink-soft">
                        {copy.vendors.optionActions}
                      </th>
                      {candidates.map((candidate) => (
                        <td key={candidate.id} className="border-l border-petal-100 px-4 py-3 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setModal({ open: true, editing: candidate })
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              {copy.form.edit}
                            </button>
                            <DeleteForm
                              action={deleteVendorOptionAction}
                              id={candidate.id}
                              copy={copy}
                              confirmMessage={copy.vendors.optionDeleteConfirm}
                            />
                            <Link
                              href={
                                candidate.selected_vendor_id
                                  ? `/wedding/budget?vendor=${candidate.selected_vendor_id}`
                                  : `/wedding/budget?vendorOption=${candidate.id}`
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-olive-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-olive-700"
                            >
                              {candidate.selected_vendor_id
                                ? copy.vendors.optionOpenBudget
                                : copy.vendors.optionSelect}
                            </Link>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <OptionFormModal
        key={modal.editing?.id ?? "new-vendor-option"}
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        copy={copy}
        option={modal.editing}
        categories={formCategories}
      />
    </div>
  );
}
