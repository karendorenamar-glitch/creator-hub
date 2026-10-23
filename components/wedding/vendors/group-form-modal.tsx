"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createVendorGroupAction,
  updateVendorGroupAction,
} from "@/app/wedding/(app)/vendors/actions";
import { FormModal } from "@/components/wedding/form-modal";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import type { VendorGroup } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const SUGGESTIONS = [
  "Venue",
  "Catering",
  "Dekorasi",
  "MUA",
  "Fotografi",
  "Videografi",
  "Busana",
  "Entertainment",
  "Wedding Organizer",
  "Undangan",
  "Souvenir",
];

const smallInput =
  "w-full rounded-lg border border-olive-200 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-olive-400";

export function GroupFormModal({
  open,
  editing,
  copy,
  locale,
  picOptions,
  onClose,
}: {
  open: boolean;
  editing: VendorGroup | null;
  copy: ModuleCopy;
  locale: "en" | "id";
  picOptions: string[];
  onClose: () => void;
}) {
  const action = editing ? updateVendorGroupAction : createVendorGroupAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [rows, setRows] = useState([0, 1, 2]);
  const isCreate = !editing;

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={editing ? copy.vendors.edit : copy.vendors.addGroup}
    >
      <form action={formAction} className="space-y-4">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <FormAlert error={state?.error} />

        <Field label={copy.vendors.groupName} htmlFor="group-category">
          <input
            id="group-category"
            name="category"
            list="group-category-suggestions"
            maxLength={80}
            required
            placeholder="MUA, Dekorasi, Venue..."
            defaultValue={editing?.category ?? ""}
            className={inputClass}
          />
          <datalist id="group-category-suggestions">
            {SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </Field>

        <Field label={copy.vendors.picInternal} htmlFor="group-pic">
          <select
            id="group-pic"
            name="picInternal"
            defaultValue={editing?.pic_internal ?? ""}
            className={inputClass}
          >
            <option value="">{copy.vendors.picInternalPlaceholder}</option>
            {picOptions.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </Field>

        {isCreate ? (
          <div className="space-y-3 rounded-2xl border border-olive-200 bg-olive-50/50 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
              {copy.vendors.options}
            </p>

            {rows.map((row) => (
              <div
                key={row}
                className="space-y-2 rounded-xl border border-olive-100 bg-white p-3"
              >
                <p className="text-[11px] font-semibold text-ink-soft">
                  Opsi {row + 1}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name="optName"
                    placeholder={copy.vendors.name}
                    maxLength={120}
                    className={smallInput}
                  />
                  <input
                    name="optPic"
                    placeholder={copy.vendors.picVendor}
                    maxLength={120}
                    className={smallInput}
                  />
                  <input
                    name="optPhone"
                    placeholder={copy.vendors.picPhone}
                    maxLength={40}
                    className={smallInput}
                  />
                  <input
                    name="optQuoted"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder={copy.vendors.quoted}
                    className={smallInput}
                  />
                  <input
                    name="optAgreed"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder={copy.vendors.agreed}
                    className={smallInput}
                  />
                  <select name="optStatus" className={smallInput}>
                    {Object.keys(labelGroups.paymentStatus).map((value) => (
                      <option key={value} value={value}>
                        {label("paymentStatus", value, locale)}
                      </option>
                    ))}
                  </select>
                  <input
                    name="optPaid"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder={copy.vendors.paymentAmount}
                    aria-label={`${copy.vendors.paymentAmount} ${row + 1}`}
                    className={smallInput}
                  />
                  <input
                    name="optPaidOn"
                    type="date"
                    aria-label={`${copy.vendors.paymentDate} ${row + 1}`}
                    className={smallInput}
                  />
                  <input
                    name={`optProof${row}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    aria-label={`${copy.vendors.proofLabel} ${row + 1}`}
                    className="w-full rounded-lg border border-olive-100 bg-white px-2 py-1 text-[11px] text-ink-soft file:mr-2 file:rounded-md file:border-0 file:bg-olive-100 file:px-2 file:py-1 file:text-[10px] file:text-olive-700"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setRows((r) => [...r, r.length])}
              className="rounded-lg border border-dashed border-olive-300 px-3 py-1.5 text-xs text-olive-700 hover:bg-olive-50"
            >
              + {copy.vendors.addOption}
            </button>

            <p className="text-[11px] leading-relaxed text-cocoa/50">
              Isi nominal dibayar bila status DP atau Lunas. Vendor yang sudah
              dibayar otomatis menjadi vendor terpilih untuk kategori ini.
            </p>
          </div>
        ) : null}

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
