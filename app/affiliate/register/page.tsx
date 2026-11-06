"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  registerAffiliateAction,
  type AffiliateFormState,
} from "./actions";
import {
  DEV_TEST_PASSWORD,
  devTestEmail,
  isLocalDev,
} from "@/lib/affiliate/dev-mode";

const field =
  "mt-1 w-full rounded-xl border border-blush/70 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-rosewood";

export default function AffiliateRegisterPage() {
  const [state, action, pending] = useActionState<AffiliateFormState, FormData>(
    registerAffiliateAction,
    null,
  );
  const dev = isLocalDev();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <Link href="/affiliate" className="text-xs text-ink-soft underline">
        ← Back to Affiliate Program
      </Link>
      <h1 className="mt-4 font-heading text-3xl text-ink">Join the program</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Your account is active immediately. You can share your link right away.
      </p>

      <form action={action} className="mt-8 space-y-4">
        {state?.error ? (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {state.error}
          </p>
        ) : null}

        <label className="block text-sm font-medium text-ink">
          Name
          <input name="fullName" required maxLength={120} className={field} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email
          <input
            type="email"
            name="email"
            required
            className={field}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Password
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className={field}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Confirm password
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            className={field}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>

        {dev ? (
          <button
            type="button"
            onClick={() => {
              setEmail(devTestEmail());
              setPassword(DEV_TEST_PASSWORD);
              setConfirm(DEV_TEST_PASSWORD);
            }}
            className="w-full rounded-xl border border-dashed border-olive-300 bg-olive-50 px-3 py-2 text-[11px] text-olive-800"
          >
            DEV only · fill a test email and password
          </button>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory hover:bg-cocoa disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create affiliate account"}
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-soft">
        Already an affiliate? <Link href="/affiliate/login" className="underline">Sign in</Link>
      </p>
    </main>
  );
}
