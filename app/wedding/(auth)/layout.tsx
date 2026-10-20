import { BrandLogo } from "@/components/wedding/brand-logo";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";

export default async function WeddingAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const copy = weddingCopy[await getLocale()];

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-olive-100 via-olive-50 to-sand-100 p-12 lg:flex">
        <BrandLogo size="lg" />

        <div className="max-w-md">
          <h2 className="font-heading text-4xl leading-tight font-semibold text-ink">
            {copy.auth.brandTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            {copy.auth.brandTagline}
          </p>
        </div>

        <p className="text-xs text-ink-soft/80">
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
