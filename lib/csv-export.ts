import { getCampaignCreatorDealAmount } from "@/lib/campaign-creator-deal";
import {
  calculateEngagementRate,
  formatCreatorListUsername,
  formatDate,
} from "@/lib/utils";
import type {
  CampaignCreator,
  CampaignDetail,
  DashboardStats,
  VideoWithCreator,
} from "@/types/database";

type CsvCell = string | number | null | undefined;

function escapeCsvCell(value: CsvCell): string {
  const text = value == null ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function rowsToCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function slugifyFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type CreatorVideoTotals = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

function aggregateCreatorVideoTotals(videos: VideoWithCreator[]) {
  const map = new Map<string, CreatorVideoTotals>();

  for (const video of videos) {
    const existing = map.get(video.creator_id) ?? {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };

    map.set(video.creator_id, {
      views: existing.views + video.views,
      likes: existing.likes + video.likes,
      comments: existing.comments + video.comments,
      shares: existing.shares + video.shares,
      saves: existing.saves + video.saves,
    });
  }

  return map;
}

function formatErPercent(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}

function formatIdrAmount(value: number | null | undefined) {
  if (value == null || value <= 0) {
    return "";
  }

  return value;
}

export function buildCampaignPerformanceCsv(
  campaign: CampaignDetail,
  creators: CampaignCreator[],
) {
  const statsByCreator = aggregateCreatorVideoTotals(campaign.videos);
  const sortedCreators = [...creators].sort(
    (left, right) =>
      (statsByCreator.get(right.id)?.views ?? 0) -
      (statsByCreator.get(left.id)?.views ?? 0),
  );

  const rows: CsvCell[][] = [
    ["Campaign performance export"],
    ["Campaign", campaign.name],
    ["Client", campaign.client_name ?? ""],
    ["Status", campaign.status],
    ["Start date", formatDate(campaign.start_date)],
    ["End date", formatDate(campaign.end_date)],
    ["Budget (IDR)", campaign.budget],
    ["Total views", campaign.total_views],
    ["Total likes", campaign.total_likes],
    ["Total comments", campaign.total_comments],
    ["Total shares", campaign.total_shares],
    ["Total saves", campaign.total_saves],
    ["Average ER (%)", formatErPercent(campaign.engagement_rate)],
    ["CPV (IDR)", formatIdrAmount(campaign.cpv)],
    ["CPE (IDR)", formatIdrAmount(campaign.cpe)],
    ["Creators", sortedCreators.length],
    ["Videos", campaign.videos.length],
    [],
    [
      "Creator",
      "Username",
      "Platform",
      "Views",
      "Likes",
      "Comments",
      "Shares",
      "Saves",
      "ER (%)",
      "Deal type",
      "Fee / Value (IDR)",
    ],
  ];

  for (const creator of sortedCreators) {
    const stats = statsByCreator.get(creator.id) ?? {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };
    const engagementRate = calculateEngagementRate(
      stats.views,
      stats.likes,
      stats.comments,
      stats.shares,
      stats.saves,
    );

    rows.push([
      creator.name,
      formatCreatorListUsername(creator),
      creator.platform,
      stats.views,
      stats.likes,
      stats.comments,
      stats.shares,
      stats.saves,
      stats.views > 0 ? formatErPercent(engagementRate) : "",
      creator.deal_type ?? "paid",
      formatIdrAmount(getCampaignCreatorDealAmount(creator)),
    ]);
  }

  rows.push([]);
  rows.push([
    "Video",
    "Creator",
    "Platform",
    "Views",
    "Likes",
    "Comments",
    "Shares",
    "Saves",
    "ER (%)",
  ]);

  const sortedVideos = [...campaign.videos].sort(
    (left, right) => right.views - left.views,
  );

  for (const video of sortedVideos) {
    const engagementRate = calculateEngagementRate(
      video.views,
      video.likes,
      video.comments,
      video.shares,
      video.saves,
    );

    rows.push([
      video.video_url,
      video.creators?.name ?? "",
      video.creators?.platform ?? "",
      video.views,
      video.likes,
      video.comments,
      video.shares,
      video.saves,
      video.views > 0 ? formatErPercent(engagementRate) : "",
    ]);
  }

  return rowsToCsv(rows);
}

export function getCampaignPerformanceCsvFilename(campaignName: string) {
  const slug = slugifyFilename(campaignName) || "campaign";
  return `${slug}-performance.csv`;
}

export function buildDashboardCsv(
  stats: DashboardStats,
  filterLabel: string,
  includePillarComparison: boolean,
) {
  const { workspace } = stats;
  const rows: CsvCell[][] = [
    ["Dashboard performance export"],
    ["Filters", filterLabel],
    [],
    ["Metric", "Value"],
    ["Active campaigns", stats.activeCampaigns],
    ["Total budget (IDR)", stats.totalBudget],
    ["Total views", stats.totalCampaignViews],
    ["Average ER (%)", formatErPercent(stats.averageEngagementRate)],
    ["CPV (IDR)", formatIdrAmount(stats.costPerView)],
    [],
    ["Creator", "Platform", "Views", "Saves", "ER (%)", "CPV (IDR)"],
  ];

  for (const row of workspace.creatorComparison) {
    rows.push([
      row.name,
      row.meta ?? "",
      row.views,
      row.saves,
      formatErPercent(row.engagementRate),
      row.cpv == null ? "" : row.cpv,
    ]);
  }

  rows.push([]);
  rows.push(["Campaign", "Views", "Saves", "ER (%)", "CPV (IDR)"]);

  for (const row of workspace.campaignComparison) {
    rows.push([
      row.name,
      row.views,
      row.saves,
      formatErPercent(row.engagementRate),
      row.cpv == null ? "" : row.cpv,
    ]);
  }

  if (workspace.monthlyCampaignComparison.length > 0) {
    rows.push([]);

    for (const month of workspace.monthlyCampaignComparison) {
      rows.push([`Monthly comparison — ${month.monthLabel}`]);
      rows.push(["Campaign", "Views", "Saves", "ER (%)", "CPV (IDR)"]);

      for (const campaign of month.campaigns) {
        rows.push([
          campaign.name,
          campaign.views,
          campaign.saves,
          formatErPercent(campaign.engagementRate),
          campaign.cpv == null ? "" : campaign.cpv,
        ]);
      }

      rows.push([]);
    }
  }

  if (includePillarComparison && workspace.pillarComparison.length > 0) {
    rows.push(["Content pillar", "Views", "Saves", "ER (%)"]);

    for (const row of workspace.pillarComparison) {
      rows.push([
        row.name,
        row.views,
        row.saves,
        formatErPercent(row.engagementRate),
      ]);
    }
  }

  return rowsToCsv(rows);
}

export function getDashboardCsvFilename() {
  const date = new Date().toISOString().slice(0, 10);
  return `dashboard-performance-${date}.csv`;
}
