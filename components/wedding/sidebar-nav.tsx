"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Images,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings,
  Sparkles,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { signOutAction } from "@/app/wedding/actions";
import type { AppLocale } from "@/lib/i18n/types";
import type { WeddingCopy } from "@/lib/wedding/copy";
import { cn } from "@/lib/utils";

type NavKey = keyof WeddingCopy["nav"];

const NAV: { key: NavKey; href: string; Icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", href: "/wedding/dashboard", Icon: LayoutDashboard },
  { key: "budget", href: "/wedding/budget", Icon: Wallet },
  { key: "guests", href: "/wedding/guests", Icon: Users },
  { key: "vendors", href: "/wedding/vendors", Icon: Store },
  { key: "checklist", href: "/wedding/checklist", Icon: ListOrdered },
  { key: "inspiration", href: "/wedding/inspiration", Icon: Images },
  { key: "settings", href: "/wedding/settings", Icon: Settings },
];

export function SidebarNav({
  copy,
  locale,
  couple,
  weddingDateLabel,
  onNavigate,
}: {
  copy: WeddingCopy;
  locale: AppLocale;
  couple: string;
  weddingDateLabel: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  function changeLocale(next: AppLocale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col gap-6 px-5 py-6">
      <Link
        href="/wedding/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-olive-100 text-olive-700">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block font-heading text-base font-semibold text-ink">
            Kefoo
          </span>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-clay-500">
            Wedding Planner
          </span>
        </span>
      </Link>

      <div className="rounded-2xl border border-olive-100 bg-olive-50/70 px-4 py-3">
        <p className="font-heading text-sm font-semibold text-ink">{couple}</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          {weddingDateLabel ?? copy.dashboard.dateTbc}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label={copy.nav.menu}>
        {NAV.map(({ key, href, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-olive-50 font-medium text-olive-700"
                  : "text-ink-soft hover:bg-olive-50/60 hover:text-ink",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-olive-600" : "text-ink-soft/70",
                )}
                aria-hidden
              />
              {copy.nav[key]}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-olive-100 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-soft">{copy.nav.language}</span>
          <div className="flex overflow-hidden rounded-full border border-olive-100">
            {(["en", "id"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => changeLocale(code)}
                disabled={isSwitching}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium uppercase transition-colors",
                  locale === code
                    ? "bg-olive-100 text-olive-700"
                    : "bg-white text-ink-soft hover:bg-olive-50",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden />
            {copy.nav.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}
