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

export type CampaignContentInsight = {
  title: string;
  creator_name: string;
  platform: string;
  metric_value: string;
  metric_label: string;
  video_url: string;
};

export type CampaignHealth = {
  status: "Strong" | "On Track" | "Needs Attention" | "Insufficient Data";
  headline: string;
  detail: string;
};

export type CampaignAnalytics = {
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  engagement_rate: number;
  cpv: number;
  cpe: number;
  top_creator: CampaignTopCreator | null;
  best_engagement_creator: CampaignBestEngagementCreator | null;
  most_efficient_creator: CampaignMostEfficientCreator | null;
  most_valuable_content: CampaignContentInsight | null;
  best_engagement_content: CampaignContentInsight | null;
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

type CampaignVideoInsightInput = {
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  creators: { name: string; platform: string } | null;
};

function truncateContentTitle(title: string, maxLength = 48) {
  const trimmed = title.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function calculateContentInsights(videos: CampaignVideoInsightInput[]) {
  const mostValuable = [...videos]
    .sort(
      (left, right) =>
        right.saves - left.saves ||
        right.views - left.views ||
        left.video_url.localeCompare(right.video_url),
    )
    .find((video) => video.saves > 0);

  const bestEngagement = [...videos]
    .map((video) => ({
      video,
      engagement_rate: calculateEngagementRate(
        video.views,
        video.likes,
        video.comments,
        video.shares,
        video.saves,
      ),
    }))
    .filter((entry) => entry.video.views > 0)
    .sort(
      (left, right) =>
        right.engagement_rate - left.engagement_rate ||
        right.video.views - left.video.views,
    )[0];

  return {
    most_valuable_content: mostValuable
      ? {
          title: truncateContentTitle(mostValuable.video_url),
          creator_name: mostValuable.creators?.name ?? "Unknown",
          platform: mostValuable.creators?.platform ?? "—",
          metric_label: "Saves",
          metric_value: mostValuable.saves.toLocaleString("en-US"),
          video_url: mostValuable.video_url,
        }
      : null,
    best_engagement_content: bestEngagement
      ? {
          title: truncateContentTitle(bestEngagement.video.video_url),
          creator_name: bestEngagement.video.creators?.name ?? "Unknown",
          platform: bestEngagement.video.creators?.platform ?? "—",
          metric_label: "Engagement rate",
          metric_value: `${bestEngagement.engagement_rate.toFixed(1)}%`,
          video_url: bestEngagement.video.video_url,
        }
      : null,
  };
}

export function getCampaignHealth(
  analytics: Pick<
    CampaignAnalytics,
    "total_views" | "engagement_rate" | "total_likes" | "total_comments" | "total_shares" | "total_saves"
  >,
  videoCount: number,
): CampaignHealth {
  if (videoCount === 0) {
    return {
      status: "Insufficient Data",
      headline: "Campaign tracking not started",
      detail:
        "Link creators and videos to this campaign to generate performance insights.",
    };
  }

  if (analytics.total_views === 0) {
    return {
      status: "Needs Attention",
      headline: "No measurable reach yet",
      detail:
        "Linked videos have no recorded views. Confirm tracking or refresh video metrics.",
    };
  }

  const engagementLabel = `${analytics.engagement_rate.toFixed(1)}%`;

  if (analytics.engagement_rate >= 6) {
    return {
      status: "Strong",
      headline: "Strong campaign performance",
      detail: `Engagement is healthy at ${engagementLabel} average ER with ${analytics.total_views.toLocaleString("en-US")} total views across ${videoCount} videos.`,
    };
  }

  if (analytics.engagement_rate >= 3) {
    return {
      status: "On Track",
      headline: "Campaign is on track",
      detail: `Performance is steady at ${engagementLabel} average ER. Monitor top content and optimize underperforming assets.`,
    };
  }

  return {
    status: "Needs Attention",
    headline: "Engagement needs improvement",
    detail: `Average ER is ${engagementLabel}. Review creative hooks and creator fit to lift saves and comments.`,
  };
}

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
  contentVideos: CampaignVideoInsightInput[] = [],
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

  const totalEngagements =
    totals.likes + totals.comments + totals.shares + totals.saves;
  const contentInsights = calculateContentInsights(contentVideos);

  return {
    total_views: totals.views,
    total_likes: totals.likes,
    total_comments: totals.comments,
    total_shares: totals.shares,
    total_saves: totals.saves,
    engagement_rate: calculateEngagementRateFromTotals(totals),
    cpv: totals.views > 0 ? budget / totals.views : 0,
    cpe: totalEngagements > 0 ? budget / totalEngagements : 0,
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
    ...contentInsights,
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
