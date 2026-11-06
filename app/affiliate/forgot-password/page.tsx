"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestAffiliatePasswordReset, type ResetState } from "./actions";

const field =
  "mt-1 w-full rounded-xl border border-blush/70 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-rosewood";

export default function AffiliateForgotPasswordPage() {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    requestAffiliatePasswordReset,
    null,
  );

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <Link href="/affiliate/login" className="text-xs text-ink-soft underline">← Back to sign in</Link>
      <h1 className="mt-4 font-heading text-3xl text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-soft">We will email you a link to set a new password.</p>

      <form action={action} className="mt-8 space-y-4">
        {state?.error ? (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>
        ) : null}
        {state?.ok ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.ok}</p>
        ) : null}
        <label className="block text-sm font-medium text-ink">
          Email
          <input type="email" name="email" required className={field} autoComplete="email" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory hover:bg-cocoa disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </main>
  );
}
