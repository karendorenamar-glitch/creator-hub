import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { CampaignDetailSection } from "@/components/campaigns/campaign-detail-section";
import { getCampaignById, getCreators, getVideos } from "@/lib/data";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;

  const [campaign, creators, videos] = await Promise.all([
    getCampaignById(id),
    getCreators(),
    getVideos(),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <>
      <Header
        title="Campaign Details"
        description="Executive performance summary for this campaign."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignDetailSection
          campaign={campaign}
          creators={creators}
          videos={videos}
        />
      </main>
    </>
  );
}
