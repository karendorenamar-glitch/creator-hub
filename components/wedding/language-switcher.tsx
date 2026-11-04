"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import type { AppLocale } from "@/lib/i18n/types";

const OPTIONS: { code: AppLocale; label: string; short: string }[] = [
  { code: "id", label: "Bahasa Indonesia", short: "ID" },
  { code: "en", label: "English", short: "EN" },
];

export function LanguageSwitcher({
  locale,
  className = "",
}: {
  locale: AppLocale;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: AppLocale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-olive-200 bg-white/80 p-1 ${className}`}
      role="group"
      aria-label="Language / Bahasa"
    >
      {OPTIONS.map((option) => {
        const active = option.code === locale;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => change(option.code)}
            disabled={pending}
            aria-pressed={active}
            title={option.label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
              active
                ? "bg-olive-700 text-white"
                : "text-ink-soft hover:bg-olive-50"
            } disabled:opacity-60`}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
