"use client";

import { useActionState } from "react";
import type { SeserahanState } from "@/app/wedding/(app)/seserahan/actions";

const inputClass =
  "w-full rounded-xl border border-rose-200/70 bg-white/80 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200/60";

const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export type ItemValues = {
  id: string;
  party: "groom" | "bride";
  name: string;
  categoryName: string | null;
  quantity: number;
  status: "purchased" | "not_purchased";
  notes: string | null;
};

export function ItemForm({
  action,
  party,
  categories,
  item,
  submitLabel,
}: {
  action: (state: SeserahanState, formData: FormData) => Promise<SeserahanState>;
  party: "groom" | "bride";
  categories: string[];
  item?: ItemValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="party" value={party} />

      <div>
        <label className={labelClass} htmlFor={`name-${item?.id ?? party}`}>
          Nama item *
        </label>
        <input
          id={`name-${item?.id ?? party}`}
          name="name"
          required
          maxLength={120}
          defaultValue={item?.name ?? ""}
          placeholder="Contoh: Perhiasan emas"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Kategori</label>
        <input
          name="categoryName"
          list="seserahan-category-options"
          maxLength={60}
          defaultValue={item?.categoryName ?? ""}
          placeholder="Pilih atau ketik kategori"
          className={inputClass}
        />
        <datalist id="seserahan-category-options">
          {categories.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Harga</label>
          <input
            name="price"
            inputMode="numeric"
            placeholder={item ? "kosongkan = tetap" : "0"}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Jumlah</label>
          <input
            name="quantity"
            type="number"
            min={1}
            max={999}
            defaultValue={item?.quantity ?? 1}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            name="status"
            defaultValue={item?.status ?? "not_purchased"}
            className={inputClass}
          >
            <option value="not_purchased">Belum Dibeli</option>
            <option value="purchased">Sudah Dibeli</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Catatan</label>
        <textarea
          name="notes"
          rows={2}
          maxLength={2000}
          defaultValue={item?.notes ?? ""}
          placeholder="Opsional"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Foto (bisa lebih dari satu)</label>
        <input
          type="file"
          name="photos"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose-700"
        />
      </div>

      {state?.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
