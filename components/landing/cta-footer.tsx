"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
  GradientButton,
  FREE_TRIAL_SIGNUP_HREF,
  SIGN_IN_HREF,
} from "@/components/landing/landing-shared";

export function CTAFooter() {
  return (
    <>
      <section id="access" className="relative py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
        <div className={CONTAINER_CLASS}>
          <FadeIn>
            <GlassCard
              glow
              hover={false}
              frame
              className="relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kefoo-500/10 via-transparent to-kefoo-500/15" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-slate-200/30" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] border border-slate-200/15" />
              <div className="relative mx-auto max-w-3xl">
                <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  Start tracking campaigns today.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  Create your workspace, add creators, and see live performance
                  in minutes. No demo required.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <GradientButton href={FREE_TRIAL_SIGNUP_HREF} size="lg">
                    Start free trial
                    <ArrowRight className="h-5 w-5" />
                  </GradientButton>
                  <Link
                    href={SIGN_IN_HREF}
                    className="text-sm font-medium text-slate-600 transition-colors hover:text-kefoo-600"
                  >
                    Sign in to your workspace
                  </Link>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 pb-10 pt-12">
        <div className={CONTAINER_CLASS}>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
            <KeffooBrandLockup size="md" />
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <Link href="#features" className="transition-colors hover:text-kefoo-600">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-kefoo-600">
                Pricing
              </Link>
              <Link href={SIGN_IN_HREF} className="transition-colors hover:text-kefoo-600">
                Sign in
              </Link>
              <Link
                href={FREE_TRIAL_SIGNUP_HREF}
                className="transition-colors hover:text-kefoo-600"
              >
                Start free trial
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center">
            <a
              href="mailto:hello@kefoo.tech"
              className="text-sm font-bold text-kefoo-600 transition-colors hover:text-kefoo-500"
            >
              hello@kefoo.tech
            </a>
            <p className="mt-2 text-xs text-slate-500">
              © {new Date().getFullYear()} Kefoo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
