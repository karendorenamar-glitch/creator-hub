"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/wedding/sidebar-nav";
import type { AppLocale } from "@/lib/i18n/types";
import type { WeddingCopy } from "@/lib/wedding/copy";

export function WeddingShell({
  copy,
  locale,
  couple,
  weddingDateLabel,
  isActive,
  children,
}: {
  copy: WeddingCopy;
  locale: AppLocale;
  couple: string;
  weddingDateLabel: string | null;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-66 border-r border-blush-100 bg-white/80 backdrop-blur lg:block">
        <SidebarNav
          copy={copy}
          locale={locale}
          couple={couple}
          weddingDateLabel={weddingDateLabel}
          isActive={isActive}
        />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-blush-100 bg-ivory/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={copy.nav.menu}
          className="rounded-xl border border-blush-100 p-2 text-ink"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <span className="font-heading text-sm font-semibold text-ink">
          Kefoo Wedding Planner
        </span>
        <span className="size-9" aria-hidden />
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={copy.nav.closeMenu}
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={copy.nav.closeMenu}
              className="absolute right-3 top-3 rounded-lg p-2 text-ink-soft"
            >
              <X className="size-5" aria-hidden />
            </button>
            <SidebarNav
              copy={copy}
              locale={locale}
              couple={couple}
              weddingDateLabel={weddingDateLabel}
              isActive={isActive}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <main className="lg:pl-66">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
