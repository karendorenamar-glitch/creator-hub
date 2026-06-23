"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KeffooLogo } from "@/components/login/kefoo-logo";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
  GradientButton,
} from "@/components/landing/landing-shared";

export function CTAFooter() {
  return (
    <>
      <section id="access" className="py-28">
        <div className={CONTAINER_CLASS}>
          <FadeIn>
            <GlassCard
              glow
              hover={false}
              className="relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kefoo-500/10 via-transparent to-violet-500/15" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Built for the People Behind Every Campaign.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400 sm:text-base">
                  For the late nights, endless spreadsheets and everything in between.
                </p>
                <div className="mt-10 flex justify-center">
                  <GradientButton
                    href="mailto:hello@kefoo.tech?subject=Schedule%20a%20Demo"
                    size="lg"
                  >
                    Schedule a Demo
                    <ArrowRight className="h-5 w-5" />
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] pb-10 pt-12">
        <div className={CONTAINER_CLASS}>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-1.5">
              <div className="relative h-14 w-12 shrink-0 overflow-visible">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.36]">
                  <KeffooLogo />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.2em] text-white">KEFOO</p>
                <p className="text-xs text-slate-500">Creator Intelligence OS</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <Link href="#features" className="transition-colors hover:text-slate-300">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-slate-300">
                Pricing
              </Link>
              <Link href="/login" className="transition-colors hover:text-slate-300">
                Sign In
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} Kefoo. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
