"use client";

import Link from "next/link";
import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import { GradientButton, CONTAINER_CLASS } from "@/components/landing/landing-shared";
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
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"
    >
      <div className={`${CONTAINER_CLASS} flex h-16 items-center justify-between gap-6`}>
        <Link href="/" className="shrink-0">
          <KeffooBrandLockup size="sm" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-slate-600 transition-colors hover:text-kefoo-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 justify-end">
          <GradientButton href="/login">Sign In</GradientButton>
        </div>
      </div>
    </motion.header>
  );
}
