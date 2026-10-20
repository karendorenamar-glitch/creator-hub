"use client";

import { useState } from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";

const COLORS = ["#5f7248", "#9fb083", "#c9a86a", "#e3a294", "#dcc8ff"];

const PIECES = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: (index * 37) % 96,
  delay: ((index * 7) % 10) / 10,
  color: COLORS[index % COLORS.length],
  size: 6 + (index % 3) * 3,
  round: index % 2 === 0,
}));

export function GoalConfetti() {
  const [burst, setBurst] = useState(0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-olive-200 bg-gradient-to-b from-white via-olive-50/60 to-olive-100/80 p-6 text-center shadow-[0_30px_70px_-55px_rgba(74,90,57,0.7)]">
      <div
        key={burst}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {PIECES.map((piece) => (
          <span
            key={piece.id}
            className="landing-confetti absolute top-0 block"
            style={{
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.round ? "9999px" : "2px",
              animationDelay: `${piece.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-olive-700">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Tercapai
        </span>

        <p className="mt-4 font-heading text-4xl text-ink">100%</p>
        <p className="mt-1 font-heading text-lg text-ink">
          Anggaran tercapai
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
          Semua pembayaran vendor lunas, tanpa melewati batas anggaran.
        </p>

        <div className="mx-auto mt-5 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-white/80">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-olive-400 via-olive-500 to-clay-400" />
        </div>

        <button
          type="button"
          onClick={() => setBurst((value) => value + 1)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-olive-600 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-95"
        >
          <PartyPopper className="size-4" aria-hidden />
          Rayakan lagi
        </button>
      </div>
    </div>
  );
}
