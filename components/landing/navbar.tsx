"use client";

import Link from "next/link";
import { KeffooLogo } from "@/components/login/kefoo-logo";
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
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#050816]/70 backdrop-blur-xl"
    >
      <div className={`${CONTAINER_CLASS} flex h-16 items-center justify-between`}>
        <Link href="/" className="flex items-center gap-1.5">
          <div className="relative h-16 w-14 shrink-0 overflow-visible">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.46]">
              <KeffooLogo />
            </div>
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-[0.2em] text-white">KEFOO</p>
            <p className="text-xs font-medium tracking-wide text-slate-500">
              Creator Intelligence OS
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <GradientButton href="/login">Sign In</GradientButton>
      </div>
    </motion.header>
  );
}
