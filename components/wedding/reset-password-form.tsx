"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createWeddingBrowserClient } from "@/lib/wedding/supabase-browser";

const fieldClass =
  "w-full rounded-xl border border-blush-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-rosewood focus:ring-2 focus:ring-blush-100";

type Phase = "checking" | "ready" | "saving" | "done" | "invalid";

export function ResetPasswordForm({ locale }: { locale: "en" | "id" }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const isId = locale === "id";

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const supabase = createWeddingBrowserClient();
      const url = new URL(window.location.href);

      // 1. PKCE code flow: ?code=...
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) setPhase(exchangeError ? "invalid" : "ready");
        return;
      }

      // 2. Token hash flow: ?token_hash=...&type=recovery
      const tokenHash = url.searchParams.get("token_hash");
      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!cancelled) setPhase(otpError ? "invalid" : "ready");
        return;
      }

      // 3. Implicit hash flow: #access_token=...&refresh_token=...
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!cancelled) setPhase(sessionError ? "invalid" : "ready");
        return;
      }

      // 4. No params: maybe a recovery session already exists.
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setPhase(data.session ? "ready" : "invalid");
    }

    establishSession().catch(() => {
      if (!cancelled) setPhase("invalid");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(isId ? "Kata sandi minimal 8 karakter." : "Minimum 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError(isId ? "Kata sandi tidak cocok." : "Passwords do not match.");
      return;
    }

    setPhase("saving");
    const supabase = createWeddingBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setPhase("ready");
      const message = updateError.message.toLowerCase();
      setError(
        message.includes("different")
          ? isId
            ? "Kata sandi baru harus berbeda dari yang lama."
            : "Choose a different password."
          : isId
            ? "Gagal menyimpan kata sandi. Coba lagi."
            : "Could not save the password. Try again.",
      );
      return;
    }

    await supabase.auth.signOut();
    setPhase("done");
    window.setTimeout(() => router.push("/wedding/login?reset=1"), 1500);
  }

  if (phase === "checking") {
    return (
      <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-soft">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {isId ? "Memeriksa tautan…" : "Checking your link…"}
      </p>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Lock className="size-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">
          {isId
            ? "Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru."
            : "This reset link is invalid or expired. Please request a new one."}
        </p>
        <Link
          href="/wedding/forgot-password"
          className="inline-flex rounded-xl bg-rosewood px-5 py-2.5 text-sm font-medium text-ivory hover:bg-cocoa"
        >
          {isId ? "Minta tautan baru" : "Request a new link"}
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {isId
          ? "Kata sandi berhasil diperbarui. Mengalihkan ke halaman masuk…"
          : "Password updated. Redirecting to sign in…"}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-ink">
          {isId ? "Kata sandi baru" : "New password"}
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm-password"
          className="text-sm font-medium text-ink"
        >
          {isId ? "Ulangi kata sandi" : "Confirm password"}
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={phase === "saving"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rosewood px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-cocoa disabled:opacity-60"
      >
        {phase === "saving" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {phase === "saving"
          ? isId
            ? "Menyimpan…"
            : "Saving…"
          : isId
            ? "Simpan kata sandi"
            : "Save password"}
      </button>

      <p className="text-center text-xs text-ink-soft">
        <Link href="/wedding/login" className="underline underline-offset-4">
          {isId ? "Kembali ke halaman masuk" : "Back to sign in"}
        </Link>
      </p>
    </form>
  );
}