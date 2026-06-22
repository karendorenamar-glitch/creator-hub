"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { KeffooLogo, KeffooWordmark } from "@/components/login/kefoo-logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const loginInputClassName =
  "w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none backdrop-blur-sm transition-colors placeholder:text-slate-500 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60";

function LoginFormError({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
      {message}
    </p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-8">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-1.5 lg:hidden">
          <div className="relative h-16 w-16 shrink-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.36]">
              <KeffooLogo />
            </div>
          </div>
          <KeffooWordmark className="text-[10px] tracking-[0.28em] text-slate-400" />
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_0_60px_-20px_rgba(168,85,247,0.25)] backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome back 👋
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Sign in to manage creators, track campaign performance, and run
              your content operations.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="sr-only">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
                className={loginInputClassName}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="sr-only">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
                className={loginInputClassName}
              />
            </div>

            {error ? <LoginFormError message={error} /> : null}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "landing-btn-gradient mt-2 w-full rounded-2xl px-4 py-3.5 text-sm font-medium",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/"
              className="font-medium text-violet-300 transition-colors hover:text-violet-200"
            >
              Request Early Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
