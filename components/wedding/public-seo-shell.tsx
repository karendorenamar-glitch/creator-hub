import Link from "next/link";
import { ArrowRight, BookOpen, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/wedding/brand-logo";

const NAV = [
  ["Fitur", "/#fitur"],
  ["Panduan Budget", "/wedding-budget-planner"],
  ["Harga", "/#harga"],
] as const;

export function PublicSeoShell({ children }: { children: ReactNode }) {
  return (
    <div className="wedding-app wedding-surface min-h-screen bg-ivory text-cocoa">
      <header className="sticky top-0 z-40 border-b border-blush/60 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-cocoa/70 md:flex">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="transition-colors hover:text-rosewood"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/wedding/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-cocoa/70 hover:bg-blush/50 hover:text-cocoa"
            >
              Masuk
            </Link>
            <Link
              href="/wedding/signup"
              className="rounded-full bg-rosewood px-4 py-2 text-sm font-medium text-ivory hover:bg-cocoa"
            >
              Coba Kefoo
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-blush/60 bg-white/50 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandLogo />
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cocoa/60">
              Wedding planner untuk anggaran, vendor, tamu, checklist, dan
              undangan pernikahan digital.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-cocoa/60">
            <Link href="/" className="hover:text-rosewood">
              Beranda
            </Link>
            <Link
              href="/wedding-budget-planner"
              className="hover:text-rosewood"
            >
              Panduan budget
            </Link>
            <Link
              href="/wedding-budget-planner/cara-membuat-budget-pernikahan"
              className="hover:text-rosewood"
            >
              Cara membuat budget
            </Link>
            <Link href="/wedding/signup" className="hover:text-rosewood">
              Mulai merencanakan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ArticleMeta({
  label = "Panduan budget pernikahan",
}: {
  label?: string;
}) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-rosewood">
      <BookOpen className="size-3.5" aria-hidden />
      {label}
    </p>
  );
}

export function ArticleCta() {
  return (
    <div className="rounded-3xl border border-champagne/60 bg-blush/35 p-6 sm:p-8">
      <p className="font-heading text-2xl text-cocoa">
        Mulai susun budget pernikahanmu dengan lebih tenang.
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-cocoa/65">
        Kefoo membantu mencatat rencana biaya, pembayaran vendor, dan sisa
        anggaran dalam satu dashboard.
      </p>
      <Link
        href="/wedding/signup"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-rosewood px-5 py-3 text-sm font-medium text-ivory hover:bg-cocoa"
      >
        Coba Kefoo
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

export function ArticleFooter() {
  return (
    <p className="flex items-center gap-2 text-xs text-cocoa/45">
      <Heart className="size-3.5 text-petal-400" aria-hidden />
      Ditulis oleh tim Kefoo untuk membantu persiapan pernikahan yang lebih
      terorganisir.
    </p>
  );
}
