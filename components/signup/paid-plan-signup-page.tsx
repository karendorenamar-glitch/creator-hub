"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { registerPaidPlanAccount } from "@/app/actions/auth";
import { LandingBackground } from "@/components/landing/landing-shared";
import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import {
  CHECKOUT_PLAN_CONFIG,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import { isValidEmail } from "@/lib/utils";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:cursor-not-allowed disabled:opacity-60";

type PaidPlanSignupPageProps = {
  plan: CheckoutPlan;
};

export function PaidPlanSignupPage({ plan }: PaidPlanSignupPageProps) {
  const router = useRouter();
  const config = CHECKOUT_PLAN_CONFIG[plan];
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedWorkspaceName = workspaceName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (!trimmedWorkspaceName) {
      setError("Workspace name is required.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerPaidPlanAccount({
        name: trimmedName,
        workspaceName: trimmedWorkspaceName,
        email: trimmedEmail,
        password,
      });

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
        setSuccess(result.message);
        return;
      }

      if ("success" in result && result.success) {
        router.push(`/checkout/${plan}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f8fbff] text-slate-900 antialiased">
      <LandingBackground />

      <div className="relative flex min-h-dvh items-center justify-center px-5 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 flex justify-center">
            <KeffooBrandLockup size="sm" />
          </div>

          <div className="rounded-[24px] border border-kefoo-200/80 bg-white/95 p-6 shadow-[0_8px_40px_-24px_rgba(184,135,248,0.15)] backdrop-blur-sm sm:p-8">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-kefoo-600">
              {config.name} plan · {config.priceLabel}
              {config.periodLabel}
            </p>

            <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
              Let&apos;s start your journey with us
            </h1>

            <p className="mt-3 text-center text-sm text-slate-600">
              Please create your account:
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="paid-signup-workspace"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Workspace name
                </label>
                <input
                  id="paid-signup-workspace"
                  type="text"
                  autoComplete="organization"
                  placeholder="e.g. PT Maju Jaya"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  disabled={loading}
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="paid-signup-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Name
                </label>
                <input
                  id="paid-signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={loading}
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="paid-signup-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="paid-signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Insert your valid mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="paid-signup-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="paid-signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                  className={inputClassName}
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-kefoo-400 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Continue to payment"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/checkout/${plan}`)}`}
                className="font-medium text-kefoo-600 hover:text-kefoo-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
