import type { Campaign, CampaignSummary, ContentPlannerAgency } from "@/types/database";

export function getCampaignNameById(
  campaignId: string | null | undefined,
  campaigns: Pick<Campaign, "id" | "name">[],
) {
  if (!campaignId) return "—";

  return campaigns.find((campaign) => campaign.id === campaignId)?.name ?? "—";
}

export function buildCampaignSummaries(
  campaigns: Campaign[],
  creatorCounts: Record<string, number>,
  videoCounts: Record<string, number>,
): CampaignSummary[] {
  return campaigns.map((campaign) => ({
    ...campaign,
    budget: Number(campaign.budget),
    creator_count: creatorCounts[campaign.id] ?? 0,
    video_count: videoCounts[campaign.id] ?? 0,
  }));
}

export function filterPlannerItemsByCampaignId(
  items: ContentPlannerAgency[],
  campaignId: string,
) {
  return items.filter((item) => item.campaign_id === campaignId);
}

export function getLinkedPlannerCreators(
  items: { creator_names: string[] | null }[],
) {
  const creatorNames = new Set<string>();

  for (const item of items) {
    for (const name of item.creator_names ?? []) {
      const trimmed = name.trim();
      if (trimmed) {
        creatorNames.add(trimmed);
      }
    }
  }

  return [...creatorNames].sort((left, right) => left.localeCompare(right));
}
