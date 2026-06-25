import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { TeamSection } from "@/components/settings/team-section";
import { getLatestPaymentSubmissionForOrg } from "@/app/actions/payment-submissions";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getOrganizationSettings } from "@/app/actions/org";
import { getTeamWorkspaceContext } from "@/app/actions/team";
import { getOrgMembershipForAction } from "@/lib/org";
import {
  formatPaymentSubmissionStatus,
} from "@/lib/plan-checkout";
import { getTrialEndsInDays, formatTrialDate, getDaysUntilDate } from "@/lib/plan";
import { formatMoney } from "@/lib/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";

export default async function SettingsPage() {
  const locale = await getLocale();
  const [result, plan, submissionResult, teamResult, membership] =
    await Promise.all([
      getOrganizationSettings(),
      getDashboardPlanContext(),
      getLatestPaymentSubmissionForOrg(),
      getTeamWorkspaceContext(),
      getOrgMembershipForAction(),
    ]);
  const organization = "data" in result ? result.data : null;
  const latestSubmission =
    ("data" in submissionResult ? submissionResult.data : null) ?? null;
  const trialDaysLeft = getTrialEndsInDays(plan.trialEndsAt);
  const subscriptionDaysLeft = getDaysUntilDate(plan.subscriptionEndsAt);

  const teamContext = "data" in teamResult ? teamResult.data : null;
  const teamError = "error" in teamResult ? teamResult.error : null;

  return (
    <>
      <Header
        title={getMessage(locale, "pages.settings.title")}
        description={getMessage(locale, "pages.settings.description")}
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
              {plan.isAccessLocked
                ? plan.isSubscriptionExpired
                  ? "Your subscription has ended. Pay your next subscription to continue."
                  : "Your free access has ended. Update your plan and pay your subscription to continue."
                : plan.isFreeTrial
                  ? trialDaysLeft !== null
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`
                    : "You are on the free trial."
                  : subscriptionDaysLeft !== null
                    ? `${subscriptionDaysLeft} day${subscriptionDaysLeft === 1 ? "" : "s"} left in your ${plan.plan.replace("_", " ")} subscription.`
                    : `Current plan: ${plan.plan.replace("_", " ")}.`}
            </p>

            {plan.isFreeTrial ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Trial started</dt>
                  <dd className="mt-1 text-slate-900">
                    {formatTrialDate(
                      plan.trialStartedAt ?? organization?.created_at,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Trial ends</dt>
                  <dd className="mt-1 text-slate-900">
                    {formatTrialDate(plan.trialEndsAt)}
                  </dd>
                </div>
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

            {!plan.isFreeTrial && plan.subscriptionEndsAt ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Last payment</dt>
                  <dd className="mt-1 text-slate-900">
                    {formatTrialDate(plan.subscriptionStartedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Subscription ends</dt>
                  <dd className="mt-1 text-slate-900">
                    {formatTrialDate(plan.subscriptionEndsAt)}
                  </dd>
                </div>
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

            {latestSubmission ? (
              <dl className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Latest payment</dt>
                  <dd className="mt-1 text-slate-900">
                    {latestSubmission.plan.replace("_", " ")} ·{" "}
                    {formatMoney(latestSubmission.amount_idr)} ·{" "}
                    {formatPaymentSubmissionStatus(latestSubmission.status)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Submitted</dt>
                  <dd className="mt-1 text-slate-900">
                    {new Date(latestSubmission.created_at).toLocaleString("id-ID")}
                  </dd>
                </div>
                {latestSubmission.status === "pending" ? (
                  <p className="text-slate-600">
                    We are verifying your payment. This usually takes up to 1
                    business day.
                  </p>
                ) : null}
              </dl>
            ) : null}

            {plan.isFreeTrial ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/checkout/starter"
                  className="inline-flex rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Upgrade to Starter
                </Link>
                <Link
                  href="/checkout/growth"
                  className="inline-flex rounded-2xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300"
                >
                  Upgrade to Growth
                </Link>
                <Link
                  href="/checkout/scale"
                  className="inline-flex rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Upgrade to Scale
                </Link>
                <p className="w-full text-xs text-slate-500">
                  Your campaigns, creators, and videos stay in this workspace after
                  you upgrade.
                </p>
              </div>
            ) : plan.isAccessLocked ? (
              <div className="mt-4">
                <Link
                  href={`/checkout/${plan.plan}`}
                  className="inline-flex rounded-2xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300"
                >
                  Renew subscription
                </Link>
              </div>
            ) : null}

            {!plan.isAccessLocked && !plan.isFreeTrial ? (
              <div className="mt-4">
                <Link
                  href={`/checkout/${plan.plan}`}
                  className="inline-flex rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Renew early
                </Link>
              </div>
            ) : null}
          </section>

          {teamContext && !("error" in membership) ? (
            <TeamSection
              initialContext={teamContext}
              currentUserId={membership.userId}
            />
          ) : teamError ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-amber-950">Team</h2>
              <p className="mt-2 text-sm text-amber-900">{teamError}</p>
              {teamError.includes("org-team.sql") ? (
                <p className="mt-3 text-sm text-amber-800">
                  Buka Supabase → SQL Editor, lalu jalankan file{" "}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                    supabase/org-team.sql
                  </code>{" "}
                  sekali. Setelah itu refresh halaman Settings.
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Account</h2>
            <p className="mt-1 text-sm text-slate-600">
              {getMessage(locale, "pages.settings.signOutDescription")}
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
