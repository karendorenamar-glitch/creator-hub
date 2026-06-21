import {
  calculateEngagementRate,
  calculateEngagementRateFromTotals,
} from "@/lib/utils";

export type CampaignTopCreator = {
  name: string;
  platform: string;
  total_views: number;
};

export type CampaignBestEngagementCreator = {
  name: string;
  platform: string;
  engagement_rate: number;
};

export type CampaignMostEfficientCreator = {
  name: string;
  platform: string;
  cpv: number;
};

export type CampaignAnalytics = {
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  engagement_rate: number;
  cpv: number;
  top_creator: CampaignTopCreator | null;
  best_engagement_creator: CampaignBestEngagementCreator | null;
  most_efficient_creator: CampaignMostEfficientCreator | null;
};

export type CampaignVideoMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  creator_id: string;
  creators: { name: string; platform: string } | null;
};

type CreatorCampaignStats = {
  name: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

function aggregateCreatorStats(
  videos: CampaignVideoMetrics[],
): Record<string, CreatorCampaignStats> {
  return videos.reduce<Record<string, CreatorCampaignStats>>((acc, video) => {
    if (!video.creator_id) {
      return acc;
    }

    const existing = acc[video.creator_id] ?? {
      name: video.creators?.name ?? "Unknown",
      platform: video.creators?.platform ?? "—",
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };

    acc[video.creator_id] = {
      ...existing,
      views: existing.views + video.views,
      likes: existing.likes + video.likes,
      comments: existing.comments + video.comments,
      shares: existing.shares + video.shares,
      saves: existing.saves + video.saves,
    };

    return acc;
  }, {});
}

export function calculateCampaignAnalytics(
  videos: CampaignVideoMetrics[],
  budget: number,
  creatorFees: Record<string, number> = {},
): CampaignAnalytics {
  const totals = videos.reduce(
    (acc, video) => ({
      views: acc.views + video.views,
      likes: acc.likes + video.likes,
      comments: acc.comments + video.comments,
      shares: acc.shares + video.shares,
      saves: acc.saves + video.saves,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
  );

  const statsByCreator = aggregateCreatorStats(videos);
  const creatorStats = Object.entries(statsByCreator);

  const topCreatorEntry = creatorStats
    .map(([, stats]) => stats)
    .sort((a, b) => b.views - a.views)[0];

  const bestEngagementEntry = creatorStats
    .map(([, stats]) => ({
      name: stats.name,
      platform: stats.platform,
      engagement_rate: calculateEngagementRate(
        stats.views,
        stats.likes,
        stats.comments,
        stats.shares,
        stats.saves,
      ),
      views: stats.views,
    }))
    .filter((creator) => creator.views > 0)
    .sort(
      (a, b) =>
        b.engagement_rate - a.engagement_rate ||
        b.views - a.views ||
        a.name.localeCompare(b.name),
    )[0];

  const hasCreatorFees = creatorStats.some(
    ([creatorId]) => creatorFees[creatorId] != null,
  );

  const mostEfficientEntry = hasCreatorFees
    ? creatorStats
        .filter(([, stats]) => stats.views > 0)
        .map(([creatorId, stats]) => ({
          name: stats.name,
          platform: stats.platform,
          cpv: (creatorFees[creatorId] ?? 0) / stats.views,
          views: stats.views,
        }))
        .sort(
          (a, b) =>
            a.cpv - b.cpv ||
            b.views - a.views ||
            a.name.localeCompare(b.name),
        )[0]
    : null;

  return {
    total_views: totals.views,
    total_likes: totals.likes,
    total_comments: totals.comments,
    total_shares: totals.shares,
    total_saves: totals.saves,
    engagement_rate: calculateEngagementRateFromTotals(totals),
    cpv: totals.views > 0 ? budget / totals.views : 0,
    top_creator: topCreatorEntry
      ? {
          name: topCreatorEntry.name,
          platform: topCreatorEntry.platform,
          total_views: topCreatorEntry.views,
        }
      : null,
    best_engagement_creator: bestEngagementEntry
      ? {
          name: bestEngagementEntry.name,
          platform: bestEngagementEntry.platform,
          engagement_rate: bestEngagementEntry.engagement_rate,
        }
      : null,
    most_efficient_creator: mostEfficientEntry
      ? {
          name: mostEfficientEntry.name,
          platform: mostEfficientEntry.platform,
          cpv: mostEfficientEntry.cpv,
        }
      : null,
  };
}

export function parseCampaignVideoMetrics(
  video: unknown,
): CampaignVideoMetrics | null {
  if (!video || typeof video !== "object") {
    return null;
  }

  const row = video as Record<string, unknown>;
  const creators =
    row.creators && typeof row.creators === "object"
      ? (row.creators as Record<string, unknown>)
      : null;

  return {
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    shares: Number(row.shares ?? 0),
    saves: Number(row.saves ?? 0),
    creator_id: String(row.creator_id ?? ""),
    creators: creators
      ? {
          name: String(creators.name ?? "Unknown"),
          platform: String(creators.platform ?? "—"),
        }
      : null,
  };
}
