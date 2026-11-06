"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAffiliateAction, type AffiliateLoginState } from "./actions";

const field =
  "mt-1 w-full rounded-xl border border-blush/70 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-rosewood";

export default function AffiliateLoginPage() {
  const [state, action, pending] = useActionState<AffiliateLoginState, FormData>(
    loginAffiliateAction,
    null,
  );

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <Link href="/affiliate" className="text-xs text-ink-soft underline">
        ← Back to Affiliate Program
      </Link>
      <h1 className="mt-4 font-heading text-3xl text-ink">Affiliate Login</h1>

      <form action={action} className="mt-8 space-y-4">
        {state?.error ? (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {state.error}
          </p>
        ) : null}
        <label className="block text-sm font-medium text-ink">
          Email
          <input type="email" name="email" required className={field} autoComplete="email" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Password
          <input type="password" name="password" required className={field} autoComplete="current-password" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory hover:bg-cocoa disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-soft">
        New here? <Link href="/affiliate/register" className="underline">Join the program</Link>
      </p>
    </main>
  );
}
