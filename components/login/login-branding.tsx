import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import { GradientText } from "@/components/landing/landing-shared";

export function LoginBranding() {
  return (
    <div className="relative hidden h-full min-h-0 w-1/2 overflow-hidden bg-white lg:flex lg:flex-col lg:items-center lg:justify-center">
      <div className="relative w-full max-w-md px-8 text-center xl:px-12">
        <div className="mb-8 flex justify-center">
          <KeffooBrandLockup size="lg" />
        </div>

        <p className="mb-4 text-xs font-medium tracking-wide text-kefoo-600">
          Creator Intelligence OS · Built for KOL agencies
        </p>

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 xl:text-4xl">
          Drop a link.{" "}
          <GradientText>Track and scale creator performance</GradientText>{" "}
          instantly.
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
          Paste TikTok or Instagram links, track campaigns, compare results,
          and manage payouts — all in one place.
        </p>
      </div>
    </div>
  );
}
