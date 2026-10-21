"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  requestPasswordResetAction,
  type FormState,
} from "@/app/wedding/actions";

const fieldClass =
  "w-full rounded-xl border border-blush-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-rosewood focus:ring-2 focus:ring-blush-100";

export function ForgotPasswordForm({ locale }: { locale: "en" | "id" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    null,
  );
  const isId = locale === "id";

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
      {state?.info ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          {state.info}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="text-sm font-medium text-ink">
          {isId ? "Email akun" : "Account email"}
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rosewood px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-cocoa disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending
          ? isId
            ? "Mengirim…"
            : "Sending…"
          : isId
            ? "Kirim tautan reset"
            : "Send reset link"}
      </button>

      <p className="text-center text-xs text-ink-soft">
        <Link href="/wedding/login" className="underline underline-offset-4">
          {isId ? "Kembali ke halaman masuk" : "Back to sign in"}
        </Link>
      </p>
    </form>
  );
}