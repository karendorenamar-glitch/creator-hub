import { DashboardPreviewCard } from "@/components/login/dashboard-preview-card";
import { KeffooLogo, KeffooWordmark } from "@/components/login/kefoo-logo";
import { GradientText } from "@/components/landing/landing-shared";

export function LoginBranding() {
  return (
    <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(168,85,247,0.14), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(110,165,247,0.1), transparent)",
        }}
        aria-hidden
      />

      <div className="relative px-16 py-20 xl:px-20">
        <div className="max-w-lg">
          <div className="mb-10 flex w-full flex-col items-center gap-1.5">
            <KeffooLogo />
            <KeffooWordmark />
          </div>

          <p className="mb-4 text-xs font-medium tracking-wide text-violet-300/90">
            Creator Intelligence OS · Built for KOL agencies
          </p>

          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-white xl:text-[2.75rem]">
            Drop a link.{" "}
            <GradientText>Track and scale creator performance</GradientText>{" "}
            instantly.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">
            Paste any TikTok or Instagram video link and get instant performance
            insights, track campaign impact, compare results, and manage payouts
            — all in one place.
          </p>

          <DashboardPreviewCard className="mt-12" />

          <p className="mt-8 text-sm text-slate-500">
            Built for KOL specialists, agencies, and brand teams.
          </p>
        </div>
      </div>
    </div>
  );
}
