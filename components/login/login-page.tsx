"use client";

import { LoginBranding } from "@/components/login/login-branding";
import { LoginForm } from "@/components/login/login-form";
import { LandingBackground } from "@/components/landing/landing-shared";

export function LoginPage({
  initialMode = "signin",
  redirectTo,
}: {
  initialMode?: "signin" | "signup";
  redirectTo?: string;
}) {
  return (
    <div className="relative h-dvh max-h-dvh overflow-hidden bg-[#fdfaff] text-slate-700 antialiased">
      <LandingBackground />
      <div className="relative flex h-full min-h-0">
        <LoginBranding />
        <LoginForm initialMode={initialMode} redirectTo={redirectTo} />
      </div>
    </div>
  );
}
