import { Header } from "@/components/layout/header";
import { CampaignsSection } from "@/components/campaigns/campaigns-section";
import {
  getCampaignSummaries,
  getCreators,
  getVideos,
} from "@/lib/data";

export default async function CampaignsPage() {
  const [campaigns, creators, videos] = await Promise.all([
    getCampaignSummaries(),
    getCreators(),
    getVideos(),
  ]);

  return (
    <>
      <Header
        title="Campaigns"
        description="Manage brand campaigns and track linked content and creators."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignsSection
          campaigns={campaigns}
          creators={creators}
          videos={videos}
        />
      </main>
    </>
  );
}
