import { getCampaignCreatorDealAmount } from "@/lib/campaign-creator-deal";
import { calculateEngagementRateFromTotals } from "@/lib/utils";
import type {
  CampaignCreatorPerformanceDetail,
  CampaignDetail,
  VideoWithCreator,
} from "@/types/database";

function aggregateVideoTotals(videos: VideoWithCreator[]) {
  return videos.reduce(
    (acc, video) => ({
      views: acc.views + video.views,
      likes: acc.likes + video.likes,
      comments: acc.comments + video.comments,
      shares: acc.shares + video.shares,
      saves: acc.saves + video.saves,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
  );
}

export function buildCampaignCreatorPerformance(
  campaign: CampaignDetail,
  creatorId: string,
): CampaignCreatorPerformanceDetail | null {
  let creator = campaign.creators.find((item) => item.id === creatorId);

  const videos = campaign.videos
    .filter((video) => video.creator_id === creatorId)
    .sort((left, right) => right.views - left.views);

  if (!creator) {
    const videoCreator = videos[0]?.creators;

    if (!videoCreator) {
      return null;
    }

    creator = {
      id: creatorId,
      org_id: campaign.org_id,
      name: videoCreator.name,
      tiktok_username: null,
      instagram_username: null,
      threads_username: null,
      contact: null,
      notes: null,
      platform: videoCreator.platform,
      followers: 0,
      fee: 0,
      created_by: null,
      created_at: campaign.created_at,
      campaign_fee: null,
      deal_type: "paid",
      deal_value: null,
      workflow_status: null,
    };
  }

  const totals = aggregateVideoTotals(videos);
  const campaignFee = getCampaignCreatorDealAmount(creator);
  const engagements =
    totals.likes + totals.comments + totals.shares + totals.saves;

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      client_name: campaign.client_name,
      status: campaign.status,
    },
    creator,
    campaign_fee: campaignFee,
    videos,
    total_videos: videos.length,
    total_views: totals.views,
    total_likes: totals.likes,
    total_comments: totals.comments,
    total_shares: totals.shares,
    total_saves: totals.saves,
    average_engagement_rate: calculateEngagementRateFromTotals(totals),
    cpv: totals.views > 0 ? campaignFee / totals.views : 0,
    cpe: engagements > 0 ? campaignFee / engagements : 0,
    cpl: totals.likes > 0 ? campaignFee / totals.likes : 0,
    top_performing_video: videos[0] ?? null,
  };
}
