import { Sparkles } from "lucide-react";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";

export default async function WeddingAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const copy = weddingCopy[await getLocale()];

  return (
    <div className="grid min-h-screen bg-ivory lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blush-100 via-blush-50 to-champagne-100 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/70 text-blush-600">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg font-semibold text-ink">
              Kefoo
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-champagne-500">
              Wedding Planner
            </span>
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="font-heading text-4xl leading-tight font-semibold text-ink">
            {copy.auth.brandTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            {copy.auth.brandTagline}
          </p>
        </div>

        <p className="text-xs text-ink-soft/80">
          Rp 20.000 {copy.common.perMonth} · {copy.billing.planName}
        </p>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/40 blur-2xl"
        />
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
