"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setAffiliatePassword, type NewPasswordState } from "./actions";

const field =
  "mt-1 w-full rounded-xl border border-blush/70 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-rosewood";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(
    setAffiliatePassword,
    null,
  );

  if (state?.ok) {
    return (
      <div className="mt-8 space-y-3">
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Password updated. You can sign in now.
        </p>
        <Link href="/affiliate/login" className="inline-block rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>
      ) : null}
      <label className="block text-sm font-medium text-ink">
        New password
        <input type="password" name="password" required minLength={8} className={field} autoComplete="new-password" />
      </label>
      <label className="block text-sm font-medium text-ink">
        Confirm password
        <input type="password" name="confirmPassword" required minLength={8} className={field} autoComplete="new-password" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory hover:bg-cocoa disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
