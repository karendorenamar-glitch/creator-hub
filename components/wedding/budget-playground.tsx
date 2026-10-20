"use client";

import { useMemo, useState } from "react";
import { Heart, Sparkles } from "lucide-react";

const TOTAL = 150_000_000;

function formatIDR(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function BudgetPlayground() {
  const [paid, setPaid] = useState(45_000_000);
  const [hearts, setHearts] = useState<number[]>([]);

  const percent = useMemo(
    () => Math.min(100, Math.round((paid / TOTAL) * 100)),
    [paid],
  );
  const remaining = TOTAL - paid;

  function addHeart() {
    const id = Date.now();
    setHearts((current) => [...current, id]);
    window.setTimeout(() => {
      setHearts((current) => current.filter((item) => item !== id));
    }, 1600);
  }

  return (
    <div className="relative rounded-3xl border border-olive-100 bg-white p-6 shadow-[0_30px_80px_-60px_rgba(74,90,57,0.6)]">
      <div className="pointer-events-none absolute inset-x-0 -top-4 flex justify-center">
        {hearts.map((id) => (
          <Heart
            key={id}
            className="landing-heart mx-1 size-5 text-rose-300"
            aria-hidden
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-olive-600">
            Coba geser anggarannya
          </p>
          <p className="mt-1 font-heading text-lg">Hailey &amp; Justin</p>
        </div>
        <button
          type="button"
          onClick={addHeart}
          aria-label="Tambahkan hati"
          className="rounded-full bg-olive-50 p-2 text-olive-600 transition-transform hover:scale-110 active:scale-95"
        >
          <Heart className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-olive-50/70 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Total biaya
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatIDR(TOTAL)}
          </p>
        </div>
        <div className="rounded-2xl bg-olive-50/70 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Sudah dibayar
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatIDR(paid)}
          </p>
        </div>
        <div className="rounded-2xl bg-olive-50/70 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Sisa biaya
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatIDR(remaining)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3.5 text-olive-500" aria-hidden />
            Anggaran terpakai
          </span>
          <span className="font-medium text-ink">{percent}%</span>
        </div>

        <input
          type="range"
          min={0}
          max={TOTAL}
          step={1_000_000}
          value={paid}
          onChange={(event) => setPaid(Number(event.target.value))}
          aria-label="Jumlah yang sudah dibayar"
          className="mt-3 w-full accent-olive-600"
        />

        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-olive-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-olive-400 to-olive-600 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        Ini contoh interaktif. Di dalam aplikasi, angka dihitung otomatis dari
        pembayaran vendor Anda.
      </p>
    </div>
  );
}
