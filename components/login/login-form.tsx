"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { registerFreeAccount, registerInvitedTeamMember } from "@/app/actions/auth";
import { resolveAuthSession } from "@/app/actions/org";
import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import { createClient } from "@/lib/supabase/client";
import { isTeamInvitePath } from "@/lib/team-invite";
import { cn, getSafeRedirectPath, isValidEmail, isValidPhoneNumber } from "@/lib/utils";

const loginInputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:cursor-not-allowed disabled:opacity-60";

type AuthMode = "signin" | "signup";

function AuthFormError({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

function AuthFormSuccess({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
      {message}
    </p>
  );
}

export function LoginForm({
  initialMode = "signin",
  redirectTo,
}: {
  initialMode?: AuthMode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const inviteRedirect = getSafeRedirectPath(redirectTo);
  const isInviteFlow = isTeamInvitePath(inviteRedirect);
  const [mode, setMode] = useState<AuthMode>(
    isInviteFlow ? "signup" : initialMode,
  );
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMode(isInviteFlow ? "signup" : initialMode);
  }, [initialMode, isInviteFlow]);

  function redirectAfterAuth() {
    if (inviteRedirect) {
      router.push(inviteRedirect);
      router.refresh();
      return;
    }

    router.push("/campaigns");
    router.refresh();
  }

  function isInvalidCredentialsMessage(message: string) {
    return message.toLowerCase().includes("invalid login credentials");
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signInError) {
      setError(
        isInviteFlow && isInvalidCredentialsMessage(signInError.message)
          ? "No account found for this email. Create an account below using the same email address as your invite."
          : signInError.message,
      );
      setLoading(false);
      return;
    }

    if (inviteRedirect) {
      setLoading(false);
      redirectAfterAuth();
      return;
    }

    const session = await resolveAuthSession();

    if ("error" in session && session.error) {
      setError(session.error);
      setLoading(false);
      return;
    }

    if ("needsOnboarding" in session && session.needsOnboarding) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    router.push(
      getSafeRedirectPath(redirectTo) ??
        ("redirectTo" in session && session.redirectTo
          ? session.redirectTo
          : "/campaigns"),
    );
    router.refresh();
  }

  async function handleInviteSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    const result = await registerInvitedTeamMember({
      email: trimmedEmail,
      password,
      confirmPassword,
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
      setSuccess(result.message);
      setLoading(false);
      switchMode("signin");
      return;
    }

    if ("success" in result && result.success) {
      redirectAfterAuth();
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    if (isInviteFlow) {
      return handleInviteSignUp(event);
    }

    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isValidPhoneNumber(trimmedPhoneNumber)) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);

    const result = await registerFreeAccount({
      email: trimmedEmail,
      password,
      confirmPassword,
      workspaceName,
      phoneNumber: trimmedPhoneNumber,
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
      setSuccess(result.message);
      setLoading(false);
      switchMode("signin");
      return;
    }

    if ("success" in result && result.success) {
      router.push(getSafeRedirectPath(redirectTo) ?? "/campaigns");
      router.refresh();
    }
  }

  const isSignUp = mode === "signup";
  const inviteTitle = isSignUp ? "Create your account" : "Sign in to join";
  const inviteDescription =
    "Use the same email address that received the team invite, then accept the invite on the next screen.";

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col lg:w-1/2">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 py-4 sm:px-8">
        <div className="my-auto w-full max-w-[400px]">
          <div className="mb-5 flex justify-center lg:hidden">
            <KeffooBrandLockup size="sm" />
          </div>

          <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_40px_-24px_rgba(15,23,42,0.08)] sm:p-6">
            <div className={cn("mb-4 text-center", isSignUp && "mb-3")}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {isInviteFlow
                  ? inviteTitle
                  : isSignUp
                    ? "Start free"
                    : "Welcome back"}
              </h2>
              {isInviteFlow ? (
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600">
                  {inviteDescription}
                </p>
              ) : !isSignUp ? (
                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">
                  Sign in to pick up where you left off — creators, campaigns, and live metrics.
                </p>
              ) : null}
            </div>

          {isSignUp ? (
            <form className="space-y-2.5" onSubmit={handleSignUp}>
              {!isInviteFlow ? (
                <div>
                  <label htmlFor="signup-workspace" className="sr-only">
                    Workspace name
                  </label>
                  <input
                    id="signup-workspace"
                    type="text"
                    placeholder="Workspace name (e.g. Acme Agency)"
                    autoComplete="organization"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    disabled={loading}
                    required
                    className={loginInputClassName}
                  />
                </div>
              ) : null}

              <div>
                <label htmlFor="signup-email" className="sr-only">
                  Email
                </label>
                <input
                  id="signup-email"
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

              {!isInviteFlow ? (
                <div>
                  <label htmlFor="signup-phone" className="sr-only">
                    Phone number
                  </label>
                  <input
                    id="signup-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone number"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    disabled={loading}
                    required
                    className={loginInputClassName}
                  />
                </div>
              ) : null}

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="Password (min. 8 characters)"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                    className={loginInputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="signup-confirm-password" className="sr-only">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    disabled={loading}
                    required
                    minLength={8}
                    className={loginInputClassName}
                  />
                </div>
              </div>

              {error ? <AuthFormError message={error} /> : null}
              {success ? <AuthFormSuccess message={success} /> : null}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "landing-btn-gradient mt-1 w-full rounded-xl px-4 py-3 text-sm font-medium",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {loading
                  ? "Creating account..."
                  : isInviteFlow
                    ? "Create account & continue"
                    : "Create free account"}
              </button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={handleSignIn}>
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

              {error ? <AuthFormError message={error} /> : null}
              {success ? <AuthFormSuccess message={success} /> : null}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "landing-btn-gradient mt-1 w-full rounded-xl px-4 py-3 text-sm font-medium",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            {isSignUp ? (
              <>
                {isInviteFlow ? "Already joined Kefoo? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-medium text-kefoo-600 transition-colors hover:text-kefoo-500"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                {isInviteFlow ? "Need an account? " : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-medium text-kefoo-600 transition-colors hover:text-kefoo-500"
                >
                  {isInviteFlow ? "Create account" : "Try it for free now"}
                </button>
              </>
            )}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
