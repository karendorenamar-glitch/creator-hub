import { redirect } from "next/navigation";
import { getPlanContext } from "@/lib/plan-enforcement";
import { getDefaultAppPath } from "@/lib/plan";
import { KeffooLogo, KeffooWordmark } from "@/components/login/kefoo-logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getActiveOrgId } from "@/lib/org";

export default async function OnboardingPage() {
  const orgId = await getActiveOrgId();

  if (orgId) {
    const planContext = await getPlanContext(orgId);
    redirect(
      getDefaultAppPath(
        planContext?.plan ?? "free_trial",
        planContext?.isTrialExpired ?? false,
      ),
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="relative h-14 w-14 shrink-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.32]">
              <KeffooLogo />
            </div>
          </div>
          <KeffooWordmark className="text-[10px] tracking-[0.28em] text-slate-500" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Set up your workspace
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create an organization to start managing campaigns in Kefoo.
        </p>

        <div className="mt-6">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
