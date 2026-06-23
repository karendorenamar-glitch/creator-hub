import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getOrganizationSettings } from "@/app/actions/org";
import { getTrialEndsInDays } from "@/lib/plan";

export default async function SettingsPage() {
  const [result, plan] = await Promise.all([
    getOrganizationSettings(),
    getDashboardPlanContext(),
  ]);
  const organization = "data" in result ? result.data : null;
  const trialDaysLeft = getTrialEndsInDays(plan.trialEndsAt);

  return (
    <>
      <Header
        title="Settings"
        description="Account and workspace preferences."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Workspace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Your organization keeps campaigns, creators, and videos isolated
              from other Kefoo customers.
            </p>

            {organization ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Organization name</dt>
                  <dd className="mt-1 text-slate-900">{organization.name}</dd>
                </div>
                {organization.slug ? (
                  <div>
                    <dt className="font-medium text-slate-500">Workspace slug</dt>
                    <dd className="mt-1 font-mono text-slate-900">
                      {organization.slug}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-red-600">
                {"error" in result ? result.error : "No workspace found."}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Plan</h2>
            <p className="mt-1 text-sm text-slate-600">
              {plan.isFreeTrial
                ? plan.isTrialExpired
                  ? "Your free trial has ended."
                  : trialDaysLeft !== null
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`
                    : "You are on the free trial."
                : `Current plan: ${plan.plan.replace("_", " ")}.`}
            </p>

            {plan.isFreeTrial || plan.isTrialExpired ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Usage</dt>
                  <dd className="mt-1 text-slate-900">
                    {plan.usage.campaigns}/{plan.limits.campaigns ?? "∞"} campaigns ·{" "}
                    {plan.usage.creators}/{plan.limits.creators ?? "∞"} creators ·{" "}
                    {plan.usage.videos}/{plan.limits.videos ?? "∞"} videos
                  </dd>
                </div>
              </dl>
            ) : null}

            {(plan.isFreeTrial || plan.isTrialExpired) && (
              <Link
                href="/#pricing"
                className="mt-4 inline-flex rounded-2xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300"
              >
                Upgrade plan
              </Link>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Account</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sign out of Kefoo on this device.
            </p>
            <div className="mt-4">
              <SignOutButton variant="settings" />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
