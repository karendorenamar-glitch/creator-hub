import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { CampaignDetailSection } from "@/components/campaigns/campaign-detail-section";
import { canEditCampaign } from "@/lib/org-team";
import { getOrgMembershipForAction } from "@/lib/org";
import { resolveResourceScopeFilter } from "@/lib/team-filter";
import { getCampaignById, getCreators } from "@/lib/data";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const membership = await getOrgMembershipForAction();

  if ("error" in membership) {
    throw new Error(membership.error);
  }

  const resourceScope = resolveResourceScopeFilter(
    membership.role,
    membership.userId,
    "all",
  );
  const performanceTeamFilter =
    membership.role === "team" ? membership.userId : "all";

  const [campaign, creators] = await Promise.all([
    getCampaignById(id, performanceTeamFilter),
    getCreators(undefined, resourceScope),
  ]);

  if (!campaign) {
    notFound();
  }

  const canEdit = canEditCampaign({
    role: membership.role,
    userId: membership.userId,
    createdBy: campaign.created_by,
  });

  return (
    <>
      <Header
        title={getMessage(locale, "pages.campaignDetails.title")}
        description={getMessage(locale, "pages.campaignDetails.description")}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignDetailSection
          campaign={campaign}
          creators={creators}
          canEdit={canEdit}
          orgId={membership.orgId}
        />
      </main>
    </>
  );
}
