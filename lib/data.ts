import { createClient } from "@/lib/supabase/server";
import {
  calculateCampaignAnalytics,
  parseCampaignVideoMetrics,
  type CampaignVideoMetrics,
} from "@/lib/campaign-analytics";
import {
  buildDashboardMonthOptions,
  getCurrentMonthKey,
  getMonthDateRange,
  matchesDashboardPlatform,
  type DashboardMonthValue,
  type DashboardPlatformValue,
} from "@/lib/dashboard-month-filter";
import { calculateEngagementRateFromTotals, parseIDRInput } from "@/lib/utils";
import type {
  CampaignDetail,
  CampaignListItem,
  Campaign,
  Creator,
  CreatorDetail,
  DashboardStats,
  VideoWithCreator,
} from "@/types/database";

function mapVideoRow(
  row: {
    id: string;
    creator_id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    created_at: string;
    creators: Pick<Creator, "name" | "platform"> | null;
  },
): VideoWithCreator {
  const { title, ...video } = row;
  return { ...video, video_url: title };
}

function mapCreatorRow(
  creator: Creator & { fee?: number | string | null },
): Creator {
  return {
    ...creator,
    fee: parseIDRInput(creator.fee),
  };
}

export async function getCreators(search?: string): Promise<Creator[]> {
  const supabase = await createClient();
  let query = supabase
    .from("creators")
    .select("id, name, username, contact, notes, platform, followers, fee, created_at")
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,contact.ilike.%${search.trim()}%,platform.ilike.%${search.trim()}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch creators:", error.message);
    return [];
  }

  return (data ?? []).map(mapCreatorRow);
}

export async function getCreatorById(id: string): Promise<CreatorDetail | null> {
  const supabase = await createClient();

  const { data: creator, error } = await supabase
    .from("creators")
    .select("id, name, username, contact, notes, platform, followers, fee, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch creator:", error.message);
    return null;
  }

  if (!creator) {
    return null;
  }

  const [videosResult, campaignsResult] = await Promise.all([
    supabase
      .from("videos")
      .select("*, creators(name, platform)")
      .eq("creator_id", id)
      .order("views", { ascending: false }),
    supabase
      .from("campaign_creators")
      .select("campaigns(id, name, brand_name, status)")
      .eq("creator_id", id),
  ]);

  const videos = (videosResult.data ?? []).map(({ title, ...video }) => ({
    ...video,
    video_url: title,
  }));

  const campaigns = (campaignsResult.data ?? [])
    .map((row) => row.campaigns)
    .filter((campaign): campaign is Pick<Campaign, "id" | "name" | "brand_name" | "status"> =>
      Boolean(campaign),
    );

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

  const average_engagement_rate = calculateEngagementRateFromTotals(totals);

  const mappedCreator = mapCreatorRow(creator);
  const fee = mappedCreator.fee;

  return {
    ...mappedCreator,
    total_videos: videos.length,
    total_views: totals.views,
    total_likes: totals.likes,
    total_comments: totals.comments,
    total_shares: totals.shares,
    total_saves: totals.saves,
    average_engagement_rate,
    cpv: totals.views > 0 ? fee / totals.views : 0,
    cpl: totals.likes > 0 ? fee / totals.likes : 0,
    campaigns,
    top_performing_video: videos[0] ?? null,
    videos,
  };
}

export async function getVideos(): Promise<VideoWithCreator[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(name, platform)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch videos:", error.message);
    return [];
  }

  return (data ?? []).map(({ title, ...video }) => ({
    ...video,
    video_url: title,
  }));
}

export async function getCampaigns(): Promise<CampaignListItem[]> {
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch campaigns:", error.message);
    return [];
  }

  if (!campaigns?.length) {
    return [];
  }

  const campaignIds = campaigns.map((campaign) => campaign.id);

  const [creatorsResult, videosResult] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("campaign_id")
      .in("campaign_id", campaignIds),
    supabase
      .from("campaign_videos")
      .select(
        "campaign_id, videos(views, likes, comments, shares, saves, creator_id, creators(name, platform))",
      )
      .in("campaign_id", campaignIds),
  ]);

  const creatorCounts = (creatorsResult.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.campaign_id] = (acc[row.campaign_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const videosByCampaign = (videosResult.data ?? []).reduce<
    Record<string, CampaignVideoMetrics[]>
  >((acc, row) => {
    const metrics = parseCampaignVideoMetrics(row.videos);
    if (!metrics) return acc;

    acc[row.campaign_id] = [...(acc[row.campaign_id] ?? []), metrics];
    return acc;
  }, {});

  return campaigns.map((campaign) => {
    const campaignVideos = videosByCampaign[campaign.id] ?? [];
    const budget = Number(campaign.budget);
    const analytics = calculateCampaignAnalytics(campaignVideos, budget);

    return {
      ...campaign,
      budget,
      creator_count: creatorCounts[campaign.id] ?? 0,
      video_count: campaignVideos.length,
      ...analytics,
    };
  });
}

export async function getCampaignById(
  id: string,
): Promise<CampaignDetail | null> {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    console.error("Failed to fetch campaign:", error?.message);
    return null;
  }

  const [creatorsResult, videosResult] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("creators(*)")
      .eq("campaign_id", id),
    supabase
      .from("campaign_videos")
      .select("videos(*, creators(name, platform))")
      .eq("campaign_id", id),
  ]);

  const creators = (creatorsResult.data ?? [])
    .map((row) => row.creators)
    .filter((creator): creator is Creator => Boolean(creator))
    .map(mapCreatorRow);

  const videos = (videosResult.data ?? [])
    .map((row) => row.videos)
    .filter((video): video is NonNullable<typeof video> => Boolean(video))
    .map((video) =>
      mapVideoRow({
        ...video,
        creators: video.creators ?? null,
      }),
    );

  const budget = Number(campaign.budget);
  const videoMetrics = videos.map((video) => ({
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    shares: video.shares,
    saves: video.saves,
    creator_id: video.creator_id,
    creators: video.creators,
  }));
  const creatorFees = Object.fromEntries(
    creators.map((creator) => [creator.id, creator.fee]),
  );
  const analytics = calculateCampaignAnalytics(
    videoMetrics,
    budget,
    creatorFees,
  );

  return {
    ...campaign,
    budget,
    creators,
    videos,
    ...analytics,
  };
}

const emptyDashboardStats = (): DashboardStats => ({
  totalCampaigns: 0,
  totalBudget: 0,
  totalCampaignViews: 0,
  averageEngagementRate: 0,
  costPerView: 0,
  topCreator: null,
  highestErCreator: null,
  mostEfficientCreator: null,
});

export async function getDashboardMonthOptions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("start_date");

  if (error) {
    console.error("Failed to fetch campaign months:", error.message);
    return buildDashboardMonthOptions([]);
  }

  return buildDashboardMonthOptions(
    (data ?? []).map((campaign) => campaign.start_date),
  );
}

export async function getDashboardStats(
  monthFilter: DashboardMonthValue = getCurrentMonthKey(),
  platformFilter: DashboardPlatformValue = "all",
): Promise<DashboardStats> {
  const supabase = await createClient();

  let campaignsQuery = supabase.from("campaigns").select("id, budget, start_date");

  if (monthFilter !== "all") {
    const { start, end } = getMonthDateRange(monthFilter);
    campaignsQuery = campaignsQuery
      .gte("start_date", start)
      .lte("start_date", end);
  }

  const { data: campaigns, error: campaignsError } = await campaignsQuery;

  if (campaignsError) {
    console.error("Failed to fetch dashboard campaigns:", campaignsError.message);
    return emptyDashboardStats();
  }

  if (!campaigns?.length) {
    return emptyDashboardStats();
  }

  const campaignIds = campaigns.map((campaign) => campaign.id);

  const [videosResult, creatorsResult] = await Promise.all([
    supabase
      .from("campaign_videos")
      .select(
        "campaign_id, videos(views, likes, comments, shares, saves, creator_id, creators(name, platform))",
      )
      .in("campaign_id", campaignIds),
    supabase
      .from("campaign_creators")
      .select("campaign_id, creator_id, creators(id, fee, platform)")
      .in("campaign_id", campaignIds),
  ]);

  const videosByCampaign = (videosResult.data ?? [])
    .map((row) => ({
      campaignId: row.campaign_id,
      metrics: parseCampaignVideoMetrics(row.videos),
    }))
    .filter(
      (
        row,
      ): row is {
        campaignId: string;
        metrics: CampaignVideoMetrics;
      } => Boolean(row.metrics),
    );

  const qualifyingCampaignIds = new Set<string>();

  if (platformFilter === "all") {
    for (const campaign of campaigns) {
      qualifyingCampaignIds.add(campaign.id);
    }
  } else {
    for (const row of videosByCampaign) {
      if (matchesDashboardPlatform(row.metrics.creators?.platform, platformFilter)) {
        qualifyingCampaignIds.add(row.campaignId);
      }
    }

    for (const row of creatorsResult.data ?? []) {
      const creator = row.creators;

      if (
        creator &&
        typeof creator === "object" &&
        "platform" in creator &&
        matchesDashboardPlatform(String(creator.platform), platformFilter)
      ) {
        qualifyingCampaignIds.add(row.campaign_id);
      }
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) =>
    qualifyingCampaignIds.has(campaign.id),
  );

  if (!filteredCampaigns.length) {
    return emptyDashboardStats();
  }

  const filteredCampaignIds = new Set(
    filteredCampaigns.map((campaign) => campaign.id),
  );

  const campaignVideos = videosByCampaign
    .filter((row) => filteredCampaignIds.has(row.campaignId))
    .filter((row) =>
      matchesDashboardPlatform(row.metrics.creators?.platform, platformFilter),
    )
    .map((row) => row.metrics);

  const creatorFees = (creatorsResult.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      if (!filteredCampaignIds.has(row.campaign_id)) {
        return acc;
      }

      const creator = row.creators;

      if (
        creator &&
        typeof creator === "object" &&
        "id" in creator &&
        matchesDashboardPlatform(
          String((creator as { platform?: string }).platform),
          platformFilter,
        )
      ) {
        acc[String(creator.id)] = parseIDRInput(
          (creator as { fee?: number | string | null }).fee,
        );
      }

      return acc;
    },
    {},
  );

  const totalBudget = filteredCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.budget),
    0,
  );

  const analytics = calculateCampaignAnalytics(
    campaignVideos,
    totalBudget,
    creatorFees,
  );

  return {
    totalCampaigns: filteredCampaigns.length,
    totalBudget,
    totalCampaignViews: analytics.total_views,
    averageEngagementRate: analytics.engagement_rate,
    costPerView: analytics.cpv,
    topCreator: analytics.top_creator
      ? {
          name: analytics.top_creator.name,
          platform: analytics.top_creator.platform,
          totalViews: analytics.top_creator.total_views,
        }
      : null,
    highestErCreator: analytics.best_engagement_creator
      ? {
          name: analytics.best_engagement_creator.name,
          platform: analytics.best_engagement_creator.platform,
          engagementRate: analytics.best_engagement_creator.engagement_rate,
        }
      : null,
    mostEfficientCreator: analytics.most_efficient_creator
      ? {
          name: analytics.most_efficient_creator.name,
          platform: analytics.most_efficient_creator.platform,
          cpv: analytics.most_efficient_creator.cpv,
        }
      : null,
  };
}
