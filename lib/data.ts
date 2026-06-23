import { createClient } from "@/lib/supabase/server";
import { requireActiveOrgId } from "@/lib/org";
import {
  calculateCampaignAnalytics,
  parseCampaignVideoMetrics,
  type CampaignVideoMetrics,
} from "@/lib/campaign-analytics";
import {
  buildDashboardWorkspaceAnalytics,
  emptyDashboardWorkspaceAnalytics,
  parseDashboardVideo,
} from "@/lib/dashboard-analytics";
import {
  buildDashboardMonthOptions,
  getCurrentMonthKey,
  getMonthDateRange,
  matchesDashboardPlatform,
  type DashboardMonthValue,
  type DashboardPlatformValue,
} from "@/lib/dashboard-month-filter";
import { enrichPayout } from "@/lib/payouts";
import { normalizeProofUrl } from "@/lib/payout-invoice";
import { calculateEngagementRateFromTotals, parseIDRInput } from "@/lib/utils";
import { buildCampaignSummaries } from "@/lib/campaigns";
import {
  normalizeCampaignCreatorWorkflowStatus,
} from "@/lib/campaign-creator-status";
import { isMissingWorkflowStatusColumn } from "@/lib/campaign-creator-workflow-db";
import type {
  CampaignDetail,
  CampaignListItem,
  Campaign,
  CampaignOption,
  CampaignSummary,
  CampaignCreator,
  ContentPlannerAgency,
  Creator,
  CreatorDetail,
  CreatorListItem,
  DashboardStats,
  Payout,
  PayoutStatus,
  PayoutWithTiming,
  VideoWithCreator,
} from "@/types/database";

async function getOrgScopedSupabase() {
  const orgId = await requireActiveOrgId();
  const supabase = await createClient();
  return { orgId, supabase };
}

function mapVideoRow(
  row: {
    id: string;
    org_id: string;
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

function mapCampaignCreator(
  creator: Creator & { fee?: number | string | null },
  campaignFee: number | string | null | undefined,
  workflowStatus: string | null | undefined,
): CampaignCreator {
  return {
    ...mapCreatorRow(creator),
    campaign_fee:
      campaignFee == null || campaignFee === ""
        ? null
        : parseIDRInput(campaignFee),
    workflow_status: normalizeCampaignCreatorWorkflowStatus(workflowStatus),
  };
}

export async function getCreators(search?: string): Promise<CreatorListItem[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();
  let query = supabase
    .from("creators")
    .select("id, org_id, name, tiktok_username, instagram_username, threads_username, contact, notes, platform, followers, fee, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `name.ilike.%${term}%,contact.ilike.%${term}%,platform.ilike.%${term}%,tiktok_username.ilike.%${term}%,instagram_username.ilike.%${term}%,threads_username.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch creators:", error.message);
    return [];
  }

  const creators = (data ?? []).map(mapCreatorRow);

  if (creators.length === 0) {
    return [];
  }

  const creatorIds = creators.map((creator) => creator.id);
  const { data: campaignLinks, error: campaignLinksError } = await supabase
    .from("campaign_creators")
    .select("creator_id, campaigns(id, name)")
    .in("creator_id", creatorIds);

  if (campaignLinksError) {
    console.error("Failed to fetch creator campaigns:", campaignLinksError.message);
    return creators.map((creator) => ({ ...creator, campaigns: [] }));
  }

  const campaignsByCreator = new Map<string, Pick<Campaign, "id" | "name">[]>();

  for (const link of campaignLinks ?? []) {
    const campaign = Array.isArray(link.campaigns)
      ? link.campaigns[0]
      : link.campaigns;

    if (!campaign?.id || !campaign.name) continue;

    const existing = campaignsByCreator.get(link.creator_id) ?? [];
    existing.push({ id: campaign.id, name: campaign.name });
    campaignsByCreator.set(link.creator_id, existing);
  }

  return creators.map((creator) => ({
    ...creator,
    campaigns: campaignsByCreator.get(creator.id) ?? [],
  }));
}

export async function getCreatorById(id: string): Promise<CreatorDetail | null> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data: creator, error } = await supabase
    .from("creators")
    .select("id, org_id, name, tiktok_username, instagram_username, threads_username, contact, notes, platform, followers, fee, created_at")
    .eq("id", id)
    .eq("org_id", orgId)
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
      .select("campaigns(id, name, client_name, status)")
      .eq("creator_id", id),
  ]);

  const videos = (videosResult.data ?? []).map(mapVideoRow);

  const campaigns = (campaignsResult.data ?? [])
    .map((row) => row.campaigns)
    .filter((campaign): campaign is Pick<Campaign, "id" | "name" | "client_name" | "status"> =>
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
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(name, platform)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch videos:", error.message);
    return [];
  }

  return (data ?? []).map(mapVideoRow);
}

export async function getCampaigns(): Promise<CampaignListItem[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("org_id", orgId)
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
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (error || !campaign) {
    console.error("Failed to fetch campaign:", error?.message);
    return null;
  }

  const [creatorsResult, videosResult] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("creator_id, fee, workflow_status, creators(*)")
      .eq("campaign_id", id),
    supabase
      .from("campaign_videos")
      .select("videos(*, creators(*))")
      .eq("campaign_id", id),
  ]);

  let creatorRows = creatorsResult.data ?? [];

  if (creatorsResult.error) {
    if (isMissingWorkflowStatusColumn(creatorsResult.error)) {
      const fallbackCreatorsResult = await supabase
        .from("campaign_creators")
        .select("creator_id, fee, creators(*)")
        .eq("campaign_id", id);

      if (fallbackCreatorsResult.error) {
        console.error(
          "Failed to fetch campaign creators:",
          fallbackCreatorsResult.error.message,
        );
        creatorRows = [];
      } else {
        creatorRows = (fallbackCreatorsResult.data ?? []).map((row) => ({
          ...row,
          workflow_status: null,
        }));
      }
    } else {
      console.error("Failed to fetch campaign creators:", creatorsResult.error.message);
      creatorRows = [];
    }
  }

  const creatorMap = new Map<string, CampaignCreator>();

  for (const row of creatorRows) {
    if (!row.creators) {
      continue;
    }

    creatorMap.set(
      row.creator_id,
      mapCampaignCreator(
        row.creators as Creator & { fee?: number | string | null },
        row.fee,
        row.workflow_status,
      ),
    );
  }

  const videos = (videosResult.data ?? [])
    .map((row) => row.videos)
    .filter((video): video is NonNullable<typeof video> => Boolean(video))
    .map((video) =>
      mapVideoRow({
        ...video,
        creators: video.creators ?? null,
      }),
    );

  for (const row of videosResult.data ?? []) {
    const creator = row.videos?.creators;
    if (
      creator &&
      "id" in creator &&
      creator.id &&
      !creatorMap.has(creator.id)
    ) {
      creatorMap.set(
        creator.id,
        mapCampaignCreator(
          creator as Creator & { fee?: number | string | null },
          null,
          null,
        ),
      );
    }
  }

  const creators = Array.from(creatorMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
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
    creators
      .map((creator) => [creator.id, creator.campaign_fee ?? creator.fee] as const)
      .filter(([, fee]) => fee > 0),
  );
  const contentVideos = videos.map((video) => ({
    video_url: video.video_url,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    shares: video.shares,
    saves: video.saves,
    creators: video.creators,
  }));
  const analytics = calculateCampaignAnalytics(
    videoMetrics,
    budget,
    creatorFees,
    contentVideos,
  );

  return {
    ...campaign,
    budget,
    creators,
    videos,
    ...analytics,
  };
}

export async function getCampaignOptions(): Promise<CampaignOption[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch campaign options:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getCampaignSummaries(): Promise<CampaignSummary[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("org_id", orgId)
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
      .select("campaign_id")
      .in("campaign_id", campaignIds),
  ]);

  const creatorCounts = (creatorsResult.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.campaign_id] = (acc[row.campaign_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const videoCounts = (videosResult.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.campaign_id] = (acc[row.campaign_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return buildCampaignSummaries(
    campaigns.map((campaign) => ({
      ...campaign,
      budget: Number(campaign.budget),
    })),
    creatorCounts,
    videoCounts,
  );
}

export async function getContentPlannerItemsByCampaignId(
  campaignId: string,
): Promise<ContentPlannerAgency[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data, error } = await supabase
    .from("content_planner_agency")
    .select(
      "id, org_id, user_id, content_pillar, content_idea, hook, creator_names, campaign_id, planned_date, inspiration_url, platform, status, created_at",
    )
    .eq("org_id", orgId)
    .eq("campaign_id", campaignId)
    .order("planned_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch campaign content planner items:", error.message);
    return [];
  }

  return data ?? [];
}

const emptyDashboardStats = (): DashboardStats => ({
  activeCampaigns: 0,
  totalBudget: 0,
  totalCampaignViews: 0,
  averageEngagementRate: 0,
  costPerView: 0,
  topCreator: null,
  highestErCreator: null,
  mostEfficientCreator: null,
  workspace: emptyDashboardWorkspaceAnalytics(),
});

export async function getDashboardMonthOptions() {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data, error } = await supabase
    .from("campaigns")
    .select("start_date")
    .eq("org_id", orgId);

  if (error) {
    console.error("Failed to fetch campaign months:", error.message);
    return buildDashboardMonthOptions([]);
  }

  return buildDashboardMonthOptions(
    (data ?? []).map((campaign) => campaign.start_date),
  );
}

export async function getDashboardCampaignOptions(
  monthFilter: DashboardMonthValue = getCurrentMonthKey(),
): Promise<{ id: string; name: string }[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  let query = supabase
    .from("campaigns")
    .select("id, name, start_date")
    .eq("org_id", orgId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (monthFilter !== "all") {
    const { start, end } = getMonthDateRange(monthFilter);
    query = query.gte("start_date", start).lte("start_date", end);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch dashboard campaign options:", error.message);
    return [];
  }

  return (data ?? []).map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
  }));
}

export async function getDashboardStats(
  monthFilter: DashboardMonthValue = getCurrentMonthKey(),
  platformFilter: DashboardPlatformValue = "all",
  campaignFilter: string = "all",
): Promise<DashboardStats> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  let campaignsQuery = supabase
    .from("campaigns")
    .select("id, name, budget, start_date")
    .eq("org_id", orgId)
    .eq("status", "active");

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

  const [videosResult, creatorsResult, plannerResult] = await Promise.all([
    supabase
      .from("campaign_videos")
      .select(
        "campaign_id, videos(id, title, views, likes, comments, shares, saves, creator_id, created_at, creators(name, platform))",
      )
      .in("campaign_id", campaignIds),
    supabase
      .from("campaign_creators")
      .select("campaign_id, creator_id, fee, creators(id, fee, platform)")
      .in("campaign_id", campaignIds),
    supabase
      .from("content_planner_agency")
      .select(
        "id, org_id, user_id, content_pillar, content_idea, hook, creator_names, campaign_id, planned_date, inspiration_url, platform, status, created_at",
      )
      .eq("org_id", orgId)
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

  const scopedCampaigns =
    campaignFilter === "all"
      ? filteredCampaigns
      : filteredCampaigns.filter((campaign) => campaign.id === campaignFilter);

  if (!scopedCampaigns.length) {
    return emptyDashboardStats();
  }

  const scopedCampaignIds = new Set(
    scopedCampaigns.map((campaign) => campaign.id),
  );

  const campaignVideos = videosByCampaign
    .filter((row) => scopedCampaignIds.has(row.campaignId))
    .filter((row) =>
      matchesDashboardPlatform(row.metrics.creators?.platform, platformFilter),
    )
    .map((row) => row.metrics);

  const creatorFees = (creatorsResult.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      if (!scopedCampaignIds.has(row.campaign_id)) {
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
          row.fee ?? (creator as { fee?: number | string | null }).fee,
        );
      }

      return acc;
    },
    {},
  );

  const totalBudget = scopedCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.budget),
    0,
  );

  const analytics = calculateCampaignAnalytics(
    campaignVideos,
    totalBudget,
    creatorFees,
  );

  const dashboardVideos = (videosResult.data ?? [])
    .map((row) => parseDashboardVideo(row.campaign_id, row.videos))
    .filter((video): video is NonNullable<typeof video> => Boolean(video))
    .filter((video) => scopedCampaignIds.has(video.campaign_id))
    .filter((video) =>
      matchesDashboardPlatform(video.creators?.platform, platformFilter),
    );

  const plannerItems = (plannerResult.data ?? []) as ContentPlannerAgency[];

  const workspaceCampaigns =
    campaignFilter === "all"
      ? filteredCampaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          budget: Number(campaign.budget),
        }))
      : scopedCampaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          budget: Number(campaign.budget),
        }));

  const campaignComparisonVideos =
    campaignFilter === "all"
      ? (videosResult.data ?? [])
          .map((row) => parseDashboardVideo(row.campaign_id, row.videos))
          .filter((video): video is NonNullable<typeof video> => Boolean(video))
          .filter((video) => qualifyingCampaignIds.has(video.campaign_id))
          .filter((video) =>
            matchesDashboardPlatform(video.creators?.platform, platformFilter),
          )
      : dashboardVideos;

  let monthlyComparisonVideos: typeof dashboardVideos = [];

  if (campaignFilter !== "all") {
    const { data: monthlyVideosResult, error: monthlyVideosError } =
      await supabase
        .from("campaign_videos")
        .select(
          "campaign_id, videos(id, title, views, likes, comments, shares, saves, creator_id, created_at, creators(name, platform))",
        )
        .eq("campaign_id", campaignFilter);

    if (monthlyVideosError) {
      console.error(
        "Failed to fetch monthly campaign videos:",
        monthlyVideosError.message,
      );
    } else {
      monthlyComparisonVideos = (monthlyVideosResult ?? [])
        .map((row) => parseDashboardVideo(row.campaign_id, row.videos))
        .filter((video): video is NonNullable<typeof video> => Boolean(video))
        .filter((video) =>
          matchesDashboardPlatform(video.creators?.platform, platformFilter),
        );
    }
  }

  const workspace = buildDashboardWorkspaceAnalytics(
    workspaceCampaigns,
    campaignFilter === "all" ? campaignComparisonVideos : dashboardVideos,
    creatorFees,
    plannerItems,
    monthlyComparisonVideos,
  );

  return {
    activeCampaigns: scopedCampaigns.length,
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
    workspace,
  };
}

export async function getContentPlannerItems(): Promise<ContentPlannerAgency[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data, error } = await supabase
    .from("content_planner_agency")
    .select(
      "id, org_id, user_id, content_pillar, content_idea, hook, creator_names, campaign_id, planned_date, inspiration_url, platform, status, created_at",
    )
    .eq("org_id", orgId)
    .order("planned_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch content planner items:", error.message);
    return [];
  }

  return data ?? [];
}

function mapPayoutRow(row: {
  id: string;
  org_id: string;
  creator_id: string;
  campaign_id: string | null;
  amount: number | string;
  status: string;
  requested_at: string;
  due_date: string;
  payment_term_days: number;
  notes: string;
  proof_url: string | null;
  created_at: string;
  creators: Pick<Creator, "name"> | Pick<Creator, "name">[] | null;
  campaigns: Pick<Campaign, "name"> | Pick<Campaign, "name">[] | null;
}): Payout {
  const creators = Array.isArray(row.creators) ? row.creators[0] : row.creators;
  const campaigns = Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns;

  return {
    id: row.id,
    org_id: row.org_id,
    creator_id: row.creator_id,
    campaign_id: row.campaign_id,
    amount: Number(row.amount),
    status: row.status as PayoutStatus,
    requested_at: row.requested_at,
    due_date: row.due_date,
    payment_term_days: row.payment_term_days,
    notes: row.notes,
    proof_url: normalizeProofUrl(row.proof_url),
    created_at: row.created_at,
    creators: creators ?? null,
    campaigns: campaigns ?? null,
  };
}

export async function getPayouts(): Promise<PayoutWithTiming[]> {
  const { orgId, supabase } = await getOrgScopedSupabase();

  const { data, error } = await supabase
    .from("payouts")
    .select(
      "id, org_id, creator_id, campaign_id, amount, status, requested_at, due_date, payment_term_days, notes, proof_url, created_at, creators(name), campaigns(name)",
    )
    .eq("org_id", orgId)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch payouts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => enrichPayout(mapPayoutRow(row)));
}
