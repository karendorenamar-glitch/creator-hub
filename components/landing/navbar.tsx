"use client";

import Link from "next/link";
import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import { GradientButton, CONTAINER_CLASS, FREE_TRIAL_SIGNUP_HREF, SIGN_IN_HREF } from "@/components/landing/landing-shared";
import { motion } from "framer-motion";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-kefoo-200/80 bg-white/80 shadow-[0_10px_40px_-28px_rgba(184,135,248,0.18)] backdrop-blur-xl"
    >
      <div className={`${CONTAINER_CLASS} flex h-16 items-center justify-between gap-6`}>
        <Link href="/" className="shrink-0">
          <KeffooBrandLockup size="sm" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="inline-flex items-center gap-1 rounded-full border border-kefoo-200/80 bg-white/80 p-1 shadow-sm">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm text-slate-600 transition-colors hover:bg-baby-50 hover:text-kefoo-600"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-3">
          <Link
            href={SIGN_IN_HREF}
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-kefoo-600 sm:inline"
          >
            Sign in
          </Link>
          <GradientButton href={FREE_TRIAL_SIGNUP_HREF}>Start free trial</GradientButton>
        </div>
      </div>
    </motion.header>
  );
}
