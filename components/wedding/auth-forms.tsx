"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  signInAction,
  signUpAction,
  type FormState,
} from "@/app/wedding/actions";
import type { WeddingCopy } from "@/lib/wedding/copy";

const initial: FormState = null;

const fieldClass =
  "w-full rounded-xl border border-olive-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-olive-400 focus:ring-2 focus:ring-olive-100";

function Alert({ state }: { state: FormState }) {
  if (!state) return null;
  const message = state.error ?? state.info;
  if (!message) return null;

  return (
    <p
      role="status"
      className={
        state.error
          ? "rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
          : "rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
      }
    >
      {message}
    </p>
  );
}

export function SignInForm({ copy, next }: { copy: WeddingCopy; next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {copy.auth.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          {copy.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? copy.auth.signingIn : copy.auth.signIn}
      </button>
      <p className="text-center text-sm text-ink-soft">
        {copy.auth.noAccount}{" "}
        <Link href="/wedding/signup" className="font-medium text-olive-700 hover:underline">
          {copy.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({
  copy,
  next,
  refCode,
}: {
  copy: WeddingCopy;
  next?: string;
  refCode?: string;
}) {
  const [state, action, pending] = useActionState(signUpAction, initial);

  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {copy.auth.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          {copy.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClass}
          placeholder="••••••••"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-ink">
          {copy.auth.confirmPassword}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClass}
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? copy.auth.signingUp : copy.auth.signUp}
      </button>
      <p className="text-center text-sm text-ink-soft">
        {copy.auth.haveAccount}{" "}
        <Link href="/wedding/login" className="font-medium text-olive-700 hover:underline">
          {copy.auth.signInLink}
        </Link>
      </p>
    </form>
  );
}
