"use client";

import { Inter } from "next/font/google";
import { LoginBranding } from "@/components/login/login-branding";
import { LoginForm } from "@/components/login/login-form";
import { LandingBackground } from "@/components/landing/landing-shared";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export function LoginPage() {
  return (
    <div
      className={`${inter.className} relative min-h-screen text-slate-100 antialiased`}
      style={{ backgroundColor: "#050816" }}
    >
      <LandingBackground />
      <div className="relative flex min-h-screen">
        <LoginBranding />
        <LoginForm />
      </div>
    </div>
  );
}
