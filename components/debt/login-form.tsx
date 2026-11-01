"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginDebtAction, type DebtAuthState } from "@/app/debt/actions";

const inputClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-olive-400 focus:ring-2 focus:ring-olive-100";

export function DebtLoginForm() {
  const [state, action, pending] = useActionState<DebtAuthState, FormData>(
    loginDebtAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="debt-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="debt-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="debt-password" className="text-sm font-medium text-ink">
          Kata sandi
        </label>
        <input
          id="debt-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Memeriksa akses…" : "Masuk ke Debt Tracker"}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-soft/80">
        Akses terbatas untuk pemilik yang sudah diizinkan. Tidak ada pendaftaran
        publik.
      </p>
    </form>
  );
}
