import {
  calculateEngagementRate,
  calculateEngagementRateFromTotals,
  formatIDRDecimal,
} from "@/lib/utils";
import type { ContentPlannerAgency } from "@/types/database";

export type DashboardVideoRecord = {
  id: string;
  campaign_id: string;
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  created_at: string;
  creator_id: string;
  creators: { name: string; platform: string } | null;
};

export type DashboardCampaignRecord = {
  id: string;
  name: string;
  budget: number;
};

export type DashboardNamedInsight = {
  name: string;
  platform: string;
  detail: string;
};

export type DashboardContentInsight = {
  title: string;
  creatorName: string;
  platform: string;
  detail: string;
};

export type DashboardComparisonRow = {
  id: string;
  name: string;
  meta?: string;
  views: number;
  saves: number;
  engagementRate: number;
  cpv: number | null;
};

export type DashboardPillarComparisonRow = {
  id: string;
  name: string;
  views: number;
  saves: number;
  engagementRate: number;
};

export type DashboardInsightCards = {
  topPerformerCreator: DashboardNamedInsight | null;
  mostValuableContent: DashboardContentInsight | null;
  lowestCpvCreator: DashboardNamedInsight | null;
  bestPerformingCampaign: DashboardNamedInsight | null;
};

export type DashboardMonthlyRow = {
  id: string;
  name: string;
  views: number;
  saves: number;
  engagementRate: number;
};

export type DashboardWorkspaceAnalytics = {
  insights: DashboardInsightCards;
  campaignComparison: DashboardComparisonRow[];
  monthlyComparison: DashboardMonthlyRow[];
  creatorComparison: DashboardComparisonRow[];
  pillarComparison: DashboardPillarComparisonRow[];
};

type CreatorAggregate = {
  name: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

type MetricTotals = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

function truncateLabel(value: string, maxLength = 40) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function aggregateCreators(
  videos: DashboardVideoRecord[],
): Record<string, CreatorAggregate> {
  return videos.reduce<Record<string, CreatorAggregate>>((acc, video) => {
    if (!video.creator_id) return acc;

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

function aggregateCampaigns(
  campaigns: DashboardCampaignRecord[],
  videos: DashboardVideoRecord[],
): DashboardComparisonRow[] {
  return campaigns
    .map((campaign) => {
      const campaignVideos = videos.filter(
        (video) => video.campaign_id === campaign.id,
      );

      const totals = campaignVideos.reduce<MetricTotals>(
        (acc, video) => ({
          views: acc.views + video.views,
          likes: acc.likes + video.likes,
          comments: acc.comments + video.comments,
          shares: acc.shares + video.shares,
          saves: acc.saves + video.saves,
        }),
        { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
      );

      return {
        id: campaign.id,
        name: campaign.name,
        views: totals.views,
        saves: totals.saves,
        engagementRate: calculateEngagementRateFromTotals(totals),
        cpv: totals.views > 0 ? campaign.budget / totals.views : null,
      };
    })
    .sort(
      (left, right) =>
        right.views - left.views || left.name.localeCompare(right.name),
    );
}

function buildCreatorComparisonRows(
  videos: DashboardVideoRecord[],
  creatorFees: Record<string, number>,
): DashboardComparisonRow[] {
  return Object.entries(aggregateCreators(videos))
    .map(([creatorId, stats]) => ({
      id: creatorId,
      name: stats.name,
      meta: stats.platform,
      views: stats.views,
      saves: stats.saves,
      engagementRate: calculateEngagementRate(
        stats.views,
        stats.likes,
        stats.comments,
        stats.shares,
        stats.saves,
      ),
      cpv:
        stats.views > 0 && creatorFees[creatorId] != null
          ? creatorFees[creatorId] / stats.views
          : null,
    }))
    .sort(
      (left, right) =>
        right.views - left.views || left.name.localeCompare(right.name),
    );
}

function resolveVideoPillar(
  video: DashboardVideoRecord,
  plannerItems: ContentPlannerAgency[],
): string {
  const creatorName = video.creators?.name?.trim().toLowerCase();

  const match = plannerItems.find((item) => {
    if (item.campaign_id !== video.campaign_id || !item.content_pillar.trim()) {
      return false;
    }

    if (!creatorName || !item.creator_names?.length) {
      return true;
    }

    return item.creator_names.some(
      (name) => name.trim().toLowerCase() === creatorName,
    );
  });

  return match?.content_pillar.trim() || "Unassigned";
}

function buildPillarComparisonRows(
  videos: DashboardVideoRecord[],
  plannerItems: ContentPlannerAgency[],
): DashboardPillarComparisonRow[] {
  const pillarTotals = videos.reduce<Record<string, MetricTotals>>(
    (acc, video) => {
      const pillar = resolveVideoPillar(video, plannerItems);
      const existing = acc[pillar] ?? {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
      };

      acc[pillar] = {
        views: existing.views + video.views,
        likes: existing.likes + video.likes,
        comments: existing.comments + video.comments,
        shares: existing.shares + video.shares,
        saves: existing.saves + video.saves,
      };

      return acc;
    },
    {},
  );

  return Object.entries(pillarTotals)
    .map(([pillar, totals]) => ({
      id: pillar,
      name: truncateLabel(pillar, 32),
      views: totals.views,
      saves: totals.saves,
      engagementRate: calculateEngagementRateFromTotals(totals),
    }))
    .sort(
      (left, right) =>
        right.views - left.views || left.name.localeCompare(right.name),
    );
}

function buildMostValuableContent(
  videos: DashboardVideoRecord[],
): DashboardContentInsight | null {
  const mostSaved = [...videos]
    .filter((video) => video.saves > 0)
    .sort(
      (left, right) =>
        right.saves - left.saves ||
        right.views - left.views ||
        left.video_url.localeCompare(right.video_url),
    )[0];

  if (!mostSaved) return null;

  return {
    title: truncateLabel(mostSaved.video_url),
    creatorName: mostSaved.creators?.name ?? "Unknown",
    platform: mostSaved.creators?.platform ?? "—",
    detail: `${mostSaved.saves.toLocaleString("en-US")} saves`,
  };
}

function buildMonthlyComparison(
  videos: DashboardVideoRecord[],
): DashboardMonthlyRow[] {
  const monthTotals = videos.reduce<Record<string, MetricTotals>>((acc, video) => {
    const createdAt = new Date(video.created_at);
    if (Number.isNaN(createdAt.getTime())) {
      return acc;
    }

    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const existing = acc[monthKey] ?? {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };

    acc[monthKey] = {
      views: existing.views + video.views,
      likes: existing.likes + video.likes,
      comments: existing.comments + video.comments,
      shares: existing.shares + video.shares,
      saves: existing.saves + video.saves,
    };

    return acc;
  }, {});

  return Object.entries(monthTotals)
    .map(([monthKey, totals]) => {
      const [year, month] = monthKey.split("-").map(Number);
      const label = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(year, month - 1, 1));

      return {
        id: monthKey,
        name: label,
        views: totals.views,
        saves: totals.saves,
        engagementRate: calculateEngagementRateFromTotals(totals),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function buildInsightCards(
  videos: DashboardVideoRecord[],
  creatorFees: Record<string, number>,
  campaignComparison: DashboardComparisonRow[],
  creatorComparison: DashboardComparisonRow[],
): DashboardInsightCards {
  const topCreator = creatorComparison[0];
  const lowestCpvCreator = [...creatorComparison]
    .filter((row) => row.cpv != null && row.views > 0)
    .sort(
      (left, right) =>
        (left.cpv ?? Number.POSITIVE_INFINITY) -
          (right.cpv ?? Number.POSITIVE_INFINITY) ||
        right.views - left.views,
    )[0];

  const bestCampaign = campaignComparison[0];

  return {
    topPerformerCreator: topCreator
      ? {
          name: topCreator.name,
          platform: topCreator.meta ?? "—",
          detail: `${topCreator.views.toLocaleString("en-US")} views`,
        }
      : null,
    mostValuableContent: buildMostValuableContent(videos),
    lowestCpvCreator: lowestCpvCreator
      ? {
          name: lowestCpvCreator.name,
          platform: lowestCpvCreator.meta ?? "—",
          detail: `${formatIDRDecimal(lowestCpvCreator.cpv ?? 0)} CPV`,
        }
      : null,
    bestPerformingCampaign: bestCampaign
      ? {
          name: bestCampaign.name,
          platform: "Campaign",
          detail: `${bestCampaign.views.toLocaleString("en-US")} views · ${bestCampaign.engagementRate.toFixed(1)}% ER`,
        }
      : null,
  };
}

export function buildDashboardWorkspaceAnalytics(
  campaigns: DashboardCampaignRecord[],
  videos: DashboardVideoRecord[],
  creatorFees: Record<string, number>,
  plannerItems: ContentPlannerAgency[],
  monthlyVideos: DashboardVideoRecord[] = [],
): DashboardWorkspaceAnalytics {
  const campaignComparison = aggregateCampaigns(campaigns, videos);
  const creatorComparison = buildCreatorComparisonRows(videos, creatorFees);
  const pillarComparison = buildPillarComparisonRows(videos, plannerItems);
  const monthlyComparison = buildMonthlyComparison(monthlyVideos);

  return {
    insights: buildInsightCards(
      videos,
      creatorFees,
      campaignComparison,
      creatorComparison,
    ),
    campaignComparison,
    monthlyComparison,
    creatorComparison,
    pillarComparison,
  };
}

export function parseDashboardVideo(
  campaignId: string,
  video: unknown,
): DashboardVideoRecord | null {
  if (!video || typeof video !== "object") {
    return null;
  }

  const row = video as Record<string, unknown>;
  const creators =
    row.creators && typeof row.creators === "object"
      ? (row.creators as Record<string, unknown>)
      : null;

  const id = String(row.id ?? "");
  if (!id) return null;

  return {
    id,
    campaign_id: campaignId,
    video_url: String(row.title ?? row.video_url ?? "Untitled"),
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    shares: Number(row.shares ?? 0),
    saves: Number(row.saves ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    creator_id: String(row.creator_id ?? ""),
    creators: creators
      ? {
          name: String(creators.name ?? "Unknown"),
          platform: String(creators.platform ?? "—"),
        }
      : null,
  };
}

export const emptyDashboardWorkspaceAnalytics = (): DashboardWorkspaceAnalytics => ({
  insights: {
    topPerformerCreator: null,
    mostValuableContent: null,
    lowestCpvCreator: null,
    bestPerformingCampaign: null,
  },
  campaignComparison: [],
  monthlyComparison: [],
  creatorComparison: [],
  pillarComparison: [],
});

export function parseDashboardCampaignParam(
  value: string | undefined,
  validCampaignIds: Set<string>,
): string {
  if (!value || value === "all") {
    return "all";
  }

  return validCampaignIds.has(value) ? value : "all";
}
