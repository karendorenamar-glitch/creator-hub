import { notFound } from "next/navigation";
import { CampaignCreatorDetailSection } from "@/components/campaigns/campaign-creator-detail-section";
import { Header } from "@/components/layout/header";
import { getCampaignCreatorPerformance } from "@/lib/data";
import { getOrgMembershipForAction } from "@/lib/org";

type CampaignCreatorDetailPageProps = {
  params: Promise<{ id: string; creatorId: string }>;
};

export default async function CampaignCreatorDetailPage({
  params,
}: CampaignCreatorDetailPageProps) {
  const { id: campaignId, creatorId } = await params;
  const membership = await getOrgMembershipForAction();

  if ("error" in membership) {
    throw new Error(membership.error);
  }

  const performanceTeamFilter =
    membership.role === "team" ? membership.userId : "all";

  const detail = await getCampaignCreatorPerformance(
    campaignId,
    creatorId,
    performanceTeamFilter,
  );

  if (!detail) {
    notFound();
  }

  return (
    <>
      <Header
        title={detail.creator.name}
        description={`${detail.campaign.name} · campaign performance`}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignCreatorDetailSection detail={detail} />
      </main>
    </>
  );
}
