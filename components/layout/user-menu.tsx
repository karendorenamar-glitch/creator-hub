"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useDashboardUser } from "@/components/layout/dashboard-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n/types";

const localeOptions: AppLocale[] = ["id", "en"];

export function UserMenu() {
  const user = useDashboardUser();
  const { locale, setLocale, t, isChangingLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const menuWidth = 240;
    const padding = 8;
    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding,
    );

    setPosition({
      top: rect.bottom + 8,
      left,
    });
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }

    updatePosition();
    setOpen(true);
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  function handleLocaleChange(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
  }

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-60 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
            style={{ top: position.top, left: position.left }}
            role="menu"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
            </div>

            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("language.label")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {localeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={locale === option}
                    disabled={isChangingLocale}
                    onClick={() => handleLocaleChange(option)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                      locale === option
                        ? "border-kefoo-300 bg-kefoo-50 text-kefoo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {t(option === "en" ? "language.en" : "language.id")}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={isPending}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {isPending ? t("user.signingOut") : t("user.signOut")}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-label={t("user.accountMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50",
          open && "border-kefoo-200 bg-kefoo-50 text-kefoo-700",
        )}
      >
        <span>{t("user.greeting", { name: user.displayName })}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </>
  );
}
