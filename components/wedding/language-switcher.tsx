"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import type { AppLocale } from "@/lib/i18n/types";

const OPTIONS: { code: AppLocale; label: string; short: string }[] = [
  { code: "id", label: "Indonesia", short: "ID" },
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
      className={`inline-flex items-center gap-1 rounded-full border border-olive-300 bg-white px-1.5 py-1 shadow-sm ${className}`}
      role="group"
      aria-label="Language / Bahasa"
    >
      <Globe className="size-3.5 shrink-0 text-olive-600" aria-hidden />
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
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors ${
              active
                ? "bg-olive-700 text-white"
                : "text-ink-soft hover:bg-olive-50"
            } disabled:opacity-60`}
          >
            <span className="sm:hidden">{option.short}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
