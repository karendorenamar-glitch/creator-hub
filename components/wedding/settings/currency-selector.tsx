"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMoney } from "@/components/wedding/currency-provider";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency/currencies";

/**
 * Reactive display-currency selector.
 *
 * Switching currency updates the store immediately, so every useMoney consumer
 * rerenders without a page reload. The preference is persisted by the store's
 * server action; on failure the previous currency stays active.
 */
export function CurrencySelector({ locale }: { locale: "en" | "id" }) {
  const money = useMoney();
  const [saved, setSaved] = useState(false);

  const active = CURRENCIES.find((item) => item.code === money.currency);
  const busy = money.pending;

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as CurrencyCode;
    if (next === money.currency) return;

    setSaved(false);
    money.clearError();
    const ok = await money.setCurrency(next);
    setSaved(ok);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1.5 text-sm font-medium text-ink">
          {locale === "en" ? "Display currency" : "Mata uang tampilan"}
          <select
            name="currency"
            value={money.currency}
            onChange={handleChange}
            disabled={busy}
            aria-busy={busy}
            className="block min-w-64 rounded-xl border border-olive-100 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-olive-400 disabled:opacity-60"
          >
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.code} · {item.name}
              </option>
            ))}
          </select>
        </label>

        <p className="pb-2.5 text-sm text-ink-soft" role="status" aria-live="polite">
          {busy ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {locale === "en" ? "Saving…" : "Menyimpan…"}
            </span>
          ) : active ? (
            <span>
              {locale === "en" ? "Active" : "Aktif"}: {active.flag}{" "}
              {active.code}
            </span>
          ) : null}
        </p>
      </div>

      {money.error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {money.error}
        </p>
      ) : null}

      {saved && !busy && !money.error ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {locale === "en"
            ? `Display currency saved. Every page now shows ${money.currency}.`
            : `Mata uang tampilan tersimpan. Semua halaman kini memakai ${money.currency}.`}
        </p>
      ) : null}

      {!money.ratesAvailable ? (
        <p className="text-xs leading-relaxed text-amber-700">
          {locale === "en"
            ? "Exchange rates are unavailable right now, so only IDR can be selected until they return."
            : "Kurs mata uang sedang tidak tersedia, jadi hanya IDR yang bisa dipilih sampai kurs kembali."}
        </p>
      ) : null}
    </div>
  );
}
