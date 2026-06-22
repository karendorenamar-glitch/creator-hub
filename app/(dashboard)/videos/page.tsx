import { Header } from "@/components/layout/header";
import { VideosSection } from "@/components/videos/videos-section";
import { getCampaignOptions, getCreators, getVideos } from "@/lib/data";

export default async function VideosPage() {
  const [videos, creators, campaigns] = await Promise.all([
    getVideos(),
    getCreators(),
    getCampaignOptions(),
  ]);

  return (
    <>
      <Header
        title="Videos"
        description="Track views, likes, comments, shares, and saves across all content."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <VideosSection
          videos={videos}
          creators={creators.map(({ id, name, platform }) => ({
            id,
            name,
            platform,
          }))}
          campaigns={campaigns}
        />
      </main>
    </>
  );
}
