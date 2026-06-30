"use server";

import { createVideoFromUrl, revalidateAfterBulkUpload } from "@/app/actions/videos";
import { fetchTikTokProfileVideos } from "@/lib/apify";
import { runWithConcurrency } from "@/lib/async-pool";
import {
  DISCOVER_PROFILE_VIDEO_LIMIT,
  MAX_DISCOVER_CREATORS,
  MAX_DISCOVER_KEYWORDS,
  type DiscoverCreatorResult,
  isVideoWithinDateRange,
  parseDiscoverKeywords,
  parseTikTokCreatorHandles,
  scoreVideoKeywordMatch,
} from "@/lib/campaign-discover";
import {
  DISCOVER_SCAN_CONCURRENCY,
  estimateDiscoverScanSeconds,
  formatDiscoverScanCooldownMessage,
  hasUnlimitedDiscoverScans,
  resolveDiscoverScanAvailability,
  DISCOVER_WEEKLY_LIMIT_NOTICE,
  type DiscoverScanAvailability,
} from "@/lib/discover-scan-limit";
import { assertCanUseDiscoverKeywords } from "@/lib/plan-enforcement";
import { getAuthUser, getOrgIdForAction } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

function isMissingDiscoverScanColumnError(message: string) {
  return message.toLowerCase().includes("discover_last_scan_at");
}

async function getDiscoverLastScanAt(orgId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("discover_last_scan_at")
    .eq("id", orgId)
    .maybeSingle();

  if (error) {
    if (isMissingDiscoverScanColumnError(error.message)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data?.discover_last_scan_at ?? null;
}

async function recordDiscoverScan(orgId: string) {
  const supabase = await createClient();
  const scannedAt = new Date().toISOString();
  const { error } = await supabase
    .from("organizations")
    .update({ discover_last_scan_at: scannedAt })
    .eq("id", orgId);

  if (error && !isMissingDiscoverScanColumnError(error.message)) {
    console.error("Failed to record discover scan:", error.message);
  }

  return scannedAt;
}

async function isDiscoverUnlimitedForCurrentUser() {
  const user = await getAuthUser();
  return hasUnlimitedDiscoverScans(user?.email);
}

export async function getDiscoverScanStatus(): Promise<
  | {
      availability: DiscoverScanAvailability;
      weeklyLimitNotice: string;
      unlimitedScans: boolean;
    }
  | { error: string }
> {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const discoverCheck = await assertCanUseDiscoverKeywords(orgResult.orgId);
  if ("error" in discoverCheck && discoverCheck.error) {
    return { error: discoverCheck.error };
  }

  const unlimitedScans = await isDiscoverUnlimitedForCurrentUser();
  const lastScanAt = await getDiscoverLastScanAt(orgResult.orgId);

  return {
    availability: resolveDiscoverScanAvailability(lastScanAt, { unlimited: unlimitedScans }),
    weeklyLimitNotice: unlimitedScans ? "" : DISCOVER_WEEKLY_LIMIT_NOTICE,
    unlimitedScans,
  };
}

const DISCOVER_SCAN_CONCURRENCY_LOCAL = DISCOVER_SCAN_CONCURRENCY;

async function assertCampaignAccess(campaignId: string) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, start_date, end_date")
    .eq("id", campaignId)
    .eq("org_id", orgResult.orgId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Campaign not found." };
  }

  return { campaign: data, orgId: orgResult.orgId };
}

export async function scanCampaignCreatorsByKeywords(input: {
  campaignId: string;
  creatorHandlesText: string;
  keywordsText: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  results?: DiscoverCreatorResult[];
  estimatedScanSeconds?: number;
  nextScanAt?: string | null;
  error?: string;
}> {
  const access = await assertCampaignAccess(input.campaignId);
  if ("error" in access) {
    return { error: access.error };
  }

  const discoverCheck = await assertCanUseDiscoverKeywords(access.orgId);
  if ("error" in discoverCheck) {
    return { error: discoverCheck.error };
  }

  const parsedHandles = parseTikTokCreatorHandles(input.creatorHandlesText);
  const keywords = parseDiscoverKeywords(input.keywordsText);

  if (parsedHandles.valid.length === 0) {
    return {
      error:
        parsedHandles.invalid.length > 0
          ? "No valid TikTok creators found. Use @username or tiktok.com/@username."
          : "Add at least one TikTok creator handle.",
    };
  }

  if (keywords.length === 0) {
    return { error: "Add at least one keyword or hashtag." };
  }

  if (parsedHandles.valid.length > MAX_DISCOVER_CREATORS) {
    return {
      error: `Remove ${parsedHandles.valid.length - MAX_DISCOVER_CREATORS} creator${parsedHandles.valid.length - MAX_DISCOVER_CREATORS === 1 ? "" : "s"} to stay within the ${MAX_DISCOVER_CREATORS}-creator limit.`,
    };
  }

  if (keywords.length > MAX_DISCOVER_KEYWORDS) {
    return {
      error: `Use up to ${MAX_DISCOVER_KEYWORDS} keywords per scan.`,
    };
  }

  const unlimitedScans = await isDiscoverUnlimitedForCurrentUser();
  const lastScanAt = await getDiscoverLastScanAt(access.orgId);
  const availability = resolveDiscoverScanAvailability(lastScanAt, {
    unlimited: unlimitedScans,
  });

  if (!availability.canScan) {
    return {
      error: formatDiscoverScanCooldownMessage(availability.waitSeconds),
      nextScanAt: availability.nextScanAt,
    };
  }

  const estimatedScanSeconds = estimateDiscoverScanSeconds(
    parsedHandles.valid.length,
  );

  const dateFrom = input.dateFrom?.trim() || access.campaign.start_date || undefined;
  const dateTo = input.dateTo?.trim() || access.campaign.end_date || undefined;

  const scanResults = await runWithConcurrency(
    parsedHandles.valid,
    DISCOVER_SCAN_CONCURRENCY_LOCAL,
    async (username): Promise<DiscoverCreatorResult> => {
      try {
        const profile = await fetchTikTokProfileVideos(username, {
          limit: DISCOVER_PROFILE_VIDEO_LIMIT,
        });

        const matches = profile.videos
          .filter((video) =>
            isVideoWithinDateRange(video.postedAt, dateFrom, dateTo),
          )
          .map((video) => {
            const { score, reasons } = scoreVideoKeywordMatch(
              video.caption,
              keywords,
            );

            return {
              videoUrl: video.videoUrl,
              caption: video.caption,
              postedAt: video.postedAt,
              views: video.views,
              matchScore: score,
              matchReasons: reasons,
            };
          })
          .filter((video) => video.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore || b.views - a.views);

        return {
          username,
          displayName: profile.displayName,
          matches,
        };
      } catch (error) {
        return {
          username,
          displayName: null,
          matches: [],
          error:
            error instanceof Error
              ? error.message
              : "Could not scan this creator.",
        };
      }
    },
  );

  const invalidCreators = parsedHandles.invalid.map((value) => ({
    username: value,
    displayName: null,
    matches: [],
    error: "Invalid TikTok handle.",
  }));

  const scannedAt = unlimitedScans
    ? null
    : await recordDiscoverScan(access.orgId);
  const nextAvailability = resolveDiscoverScanAvailability(scannedAt, {
    unlimited: unlimitedScans,
  });

  return {
    results: [...scanResults, ...invalidCreators],
    estimatedScanSeconds,
    nextScanAt: nextAvailability.nextScanAt,
  };
}

export async function addDiscoveredVideosToCampaign(input: {
  campaignId: string;
  videoUrls: string[];
}): Promise<{
  added?: number;
  createdCreators?: number;
  failures?: Array<{ videoUrl: string; error: string }>;
  error?: string;
}> {
  const access = await assertCampaignAccess(input.campaignId);
  if ("error" in access) {
    return { error: access.error };
  }

  const urls = [...new Set(input.videoUrls.map((url) => url.trim()).filter(Boolean))];

  if (urls.length === 0) {
    return { error: "Select at least one video to add." };
  }

  let added = 0;
  let createdCreators = 0;
  const failures: Array<{ videoUrl: string; error: string }> = [];

  await runWithConcurrency(urls, 5, async (videoUrl) => {
    const result = await createVideoFromUrl({
      video_url: videoUrl,
      platform: "TikTok",
      campaign_id: input.campaignId,
      import_metrics: true,
      auto_create_creator: true,
      revalidate: false,
    });

    if (result.error) {
      failures.push({ videoUrl, error: result.error });
      return;
    }

    added += 1;
    if ("createdCreator" in result && result.createdCreator) {
      createdCreators += 1;
    }
  });

  revalidateAfterBulkUpload(input.campaignId);

  return { added, createdCreators, failures };
}
