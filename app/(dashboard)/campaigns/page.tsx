import { getDashboardPlanContext } from "@/app/actions/plan";
import { Header } from "@/components/layout/header";
import { CampaignsSection } from "@/components/campaigns/campaigns-section";
import { getCampaignSummaries } from "@/lib/data";
import { getOrgMembershipForAction } from "@/lib/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";

export default async function CampaignsPage() {
  const locale = await getLocale();
  const [membership, campaigns, plan] = await Promise.all([
    getOrgMembershipForAction(),
    getCampaignSummaries("all"),
    getDashboardPlanContext(),
  ]);

  if ("error" in membership) {
    throw new Error(membership.error);
  }

  return (
    <>
      <Header
        title={getMessage(locale, "pages.campaigns.title")}
        description={getMessage(locale, "pages.campaigns.descriptionShort")}
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignsSection
          campaigns={campaigns}
          currentUserId={membership.userId}
          memberRole={membership.role}
          orgId={membership.orgId}
          usage={plan.usage}
        />
      </main>
    </>
  );
}
