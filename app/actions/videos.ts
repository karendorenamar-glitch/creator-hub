"use server";

import { linkVideoToCampaign } from "@/app/actions/campaigns";
import {
  ensureCreatorTikTokFollowers,
  findOrCreateCreatorForInstagramUsername,
  findOrCreateCreatorForTikTokUsername,
  syncCreatorInstagramProfile,
  syncCreatorTikTokProfile,
} from "@/app/actions/creators";
import { fetchVideoDataFromUrl, fetchVideoMetricsFromUrl } from "@/lib/apify";
import {
  assertCanCreateResource,
  assertCanUseTikTokImport,
  getOrganizationPlanRecord,
} from "@/lib/plan-enforcement";
import { isFreeTrialPlan, type OrgPlan } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { getOrgIdForAction } from "@/lib/org";
import { revalidateCreatorHub } from "@/lib/revalidate";
import { extractInstagramUsernameFromUrl } from "@/lib/instagram-url";
import { extractTikTokUsernameFromUrl } from "@/lib/tiktok-url";
import {
  detectVideoPlatform,
  normalizeVideoPlatform,
  validateVideoUrlForPlatform,
  type VideoPlatform,
} from "@/lib/video-url";

export type VideoInput = {
  creator_id: string;
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

function parseVideoInput(input: VideoInput) {
  return {
    creator_id: input.creator_id,
    title: input.video_url.trim(),
    views: Math.max(0, input.views),
    likes: Math.max(0, input.likes),
    comments: Math.max(0, input.comments),
    shares: Math.max(0, input.shares),
    saves: Math.max(0, input.saves),
  };
}

function extractUsernameFromVideoUrl(
  videoUrl: string,
  platform: VideoPlatform,
): string | null {
  return platform === "Instagram"
    ? extractInstagramUsernameFromUrl(videoUrl)
    : extractTikTokUsernameFromUrl(videoUrl);
}

function creatorDetectionError(platform: VideoPlatform) {
  return platform === "Instagram"
    ? "Could not detect the Instagram creator from this link."
    : "Could not detect the TikTok creator from this link.";
}

async function applyCreatorProfileFromVideo(
  creatorId: string,
  videoUrl: string,
  options?: {
    authorUsername?: string | null;
    authorDisplayName?: string | null;
    authorFollowers?: number;
  },
) {
  const platform = detectVideoPlatform(videoUrl);
  if (!platform) return;

  const username =
    options?.authorUsername ??
    extractUsernameFromVideoUrl(videoUrl, platform);

  if (platform === "Instagram") {
    await syncCreatorInstagramProfile(creatorId, {
      username,
      displayName: options?.authorDisplayName,
    });
    return;
  }

  await syncCreatorTikTokProfile(creatorId, {
    username,
    displayName: options?.authorDisplayName,
    followers: options?.authorFollowers,
  });
}

async function findOrCreateCreatorForVideo(
  platform: VideoPlatform,
  authorUsername: string,
  options: {
    platformLabel?: string;
    displayName?: string | null;
    followers?: number;
    autoCreate?: boolean;
    revalidate?: boolean;
  },
) {
  if (platform === "Instagram") {
    return findOrCreateCreatorForInstagramUsername(authorUsername, {
      platform: options.platformLabel ?? "Instagram",
      displayName: options.displayName,
      followers: options.followers,
      autoCreate: options.autoCreate,
      revalidate: options.revalidate,
    });
  }

  return findOrCreateCreatorForTikTokUsername(authorUsername, {
    platform: options.platformLabel ?? "TikTok",
    displayName: options.displayName,
    followers: options.followers,
    autoCreate: options.autoCreate,
    revalidate: options.revalidate,
  });
}

export async function createVideo(
  input: VideoInput,
  options?: {
    revalidate?: boolean;
    authorUsername?: string | null;
    authorDisplayName?: string | null;
    authorFollowers?: number;
  },
) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const limitCheck = await assertCanCreateResource(orgResult.orgId, "videos");
  if ("error" in limitCheck) {
    return { error: limitCheck.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .insert({
      ...parseVideoInput(input),
      org_id: orgResult.orgId,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await applyCreatorProfileFromVideo(input.creator_id, input.video_url, {
    authorUsername: options?.authorUsername,
    authorDisplayName: options?.authorDisplayName,
    authorFollowers: options?.authorFollowers,
  });

  if (options?.revalidate !== false) {
    revalidateCreatorHub();
  }
  return { data };
}

async function assertCanFetchTikTokData(orgId: string, platform: VideoPlatform) {
  if (platform !== "TikTok") {
    return { ok: true as const };
  }

  return assertCanUseTikTokImport(orgId);
}

const TIKTOK_FAST_PATH_ERROR =
  "Could not read @username from this TikTok link. Use a full URL like https://www.tiktok.com/@creator/video/123 or click Import Metrics first.";

export async function createVideoFromUrl(input: {
  creator_id?: string;
  video_url: string;
  platform?: string;
  campaign_id?: string;
  import_metrics?: boolean;
  auto_create_creator?: boolean;
  revalidate?: boolean;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}) {
  const trimmedUrl = input.video_url.trim();
  const requestedPlatform = normalizeVideoPlatform(input.platform);

  if (!trimmedUrl) {
    return { error: "Video URL is required." };
  }

  if (!requestedPlatform) {
    return { error: "Select TikTok or Instagram as the platform." };
  }

  const platformError = validateVideoUrlForPlatform(trimmedUrl, requestedPlatform);
  if (platformError) {
    return { error: platformError };
  }

  const detectedPlatform = detectVideoPlatform(trimmedUrl)!;
  const platformLabel = requestedPlatform;

  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const orgPlan = await getOrganizationPlanRecord(orgResult.orgId);
  const onFreeTrial = isFreeTrialPlan(
    (orgPlan?.plan ?? "free_trial") as OrgPlan,
  );

  let authorUsername: string | null = extractUsernameFromVideoUrl(
    trimmedUrl,
    detectedPlatform,
  );
  let authorDisplayName: string | null = null;
  let authorFollowers = 0;
  let metrics = input.metrics ?? {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  };

  if (input.import_metrics !== false) {
    const tikTokPlanCheck = await assertCanFetchTikTokData(
      orgResult.orgId,
      detectedPlatform,
    );
    if ("error" in tikTokPlanCheck) {
      return { error: tikTokPlanCheck.error };
    }

    try {
      const videoData = await fetchVideoDataFromUrl(trimmedUrl);
      metrics = videoData;
      authorUsername = videoData.authorUsername ?? authorUsername;
      authorDisplayName = videoData.authorDisplayName;
      authorFollowers = videoData.authorFollowers;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to import metrics.",
      };
    }
  } else if (!input.creator_id && input.auto_create_creator !== false) {
    authorUsername =
      authorUsername ?? extractUsernameFromVideoUrl(trimmedUrl, detectedPlatform);

    if (!authorUsername) {
      if (detectedPlatform === "TikTok" && onFreeTrial) {
        return { error: TIKTOK_FAST_PATH_ERROR };
      }

      const tikTokPlanCheck = await assertCanFetchTikTokData(
        orgResult.orgId,
        detectedPlatform,
      );
      if ("error" in tikTokPlanCheck) {
        return { error: tikTokPlanCheck.error };
      }

      try {
        const videoData = await fetchVideoDataFromUrl(trimmedUrl);
        authorUsername = videoData.authorUsername ?? authorUsername;
        authorDisplayName = videoData.authorDisplayName;
        authorFollowers = videoData.authorFollowers;
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : creatorDetectionError(detectedPlatform),
        };
      }
    }
  }

  let creatorId = input.creator_id;
  let createdCreator = false;

  if (!creatorId) {
    if (!authorUsername) {
      return {
        error: creatorDetectionError(detectedPlatform),
      };
    }

    const match = await findOrCreateCreatorForVideo(
      detectedPlatform,
      authorUsername,
      {
        platformLabel,
        displayName: authorDisplayName,
        followers: authorFollowers,
        autoCreate: input.auto_create_creator !== false,
        revalidate: false,
      },
    );

    if (match.error || !match.creatorId) {
      return { error: match.error ?? "Creator not found." };
    }

    creatorId = match.creatorId;
    createdCreator = match.created ?? false;
  }

  const result = await createVideo(
    {
      creator_id: creatorId,
      video_url: trimmedUrl,
      ...metrics,
    },
    { revalidate: false, authorUsername, authorDisplayName, authorFollowers },
  );

  if (result.error || !result.data) {
    return result;
  }

  if (detectedPlatform === "TikTok" && authorFollowers === 0) {
    const tikTokUsername =
      authorUsername ??
      extractUsernameFromVideoUrl(trimmedUrl, detectedPlatform);

    if (tikTokUsername) {
      await ensureCreatorTikTokFollowers(creatorId, tikTokUsername, {
        displayName: authorDisplayName,
      });
    }
  }

  if (input.campaign_id) {
    const linkResult = await linkVideoToCampaign(
      input.campaign_id,
      result.data.id,
      result.data.creator_id,
      { revalidate: input.revalidate },
    );

    if (linkResult.error) {
      return { error: linkResult.error };
    }
  } else if (input.revalidate !== false) {
    revalidateCreatorHub();
  }

  return { ...result, createdCreator };
}

export async function revalidateAfterBulkUpload(campaignId?: string) {
  revalidateCreatorHub(campaignId);
}

export async function updateVideo(id: string, input: VideoInput) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .update(parseVideoInput(input))
    .eq("id", id)
    .eq("org_id", orgResult.orgId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await applyCreatorProfileFromVideo(input.creator_id, input.video_url);

  revalidateCreatorHub();
  return { data };
}

export async function importVideoMetrics(
  videoUrl: string,
  platform?: VideoPlatform,
) {
  const trimmedUrl = videoUrl.trim();
  const requestedPlatform = normalizeVideoPlatform(platform);

  if (!trimmedUrl) {
    return { error: "Video URL is required." };
  }

  if (!requestedPlatform) {
    return { error: "Select TikTok or Instagram as the platform." };
  }

  const platformError = validateVideoUrlForPlatform(trimmedUrl, requestedPlatform);
  if (platformError) {
    return { error: platformError };
  }

  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const tikTokPlanCheck = await assertCanFetchTikTokData(
    orgResult.orgId,
    requestedPlatform,
  );
  if ("error" in tikTokPlanCheck) {
    return { error: tikTokPlanCheck.error };
  }

  try {
    const metrics = await fetchVideoMetricsFromUrl(trimmedUrl);
    return { data: metrics };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to import metrics.",
    };
  }
}

async function updateVideoMetricsFromApify(
  id: string,
  videoUrl: string,
  options?: { revalidate?: boolean },
) {
  const videoData = await fetchVideoDataFromUrl(videoUrl);
  const supabase = await createClient();

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("creator_id")
    .eq("id", id)
    .maybeSingle();

  if (videoError) {
    return { error: videoError.message };
  }

  const { data, error } = await supabase
    .from("videos")
    .update({
      views: videoData.views,
      likes: videoData.likes,
      comments: videoData.comments,
      shares: videoData.shares,
      saves: videoData.saves,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (video?.creator_id) {
    await applyCreatorProfileFromVideo(video.creator_id, videoUrl, {
      authorUsername: videoData.authorUsername,
      authorDisplayName: videoData.authorDisplayName,
      authorFollowers: videoData.authorFollowers,
    });
  }

  if (options?.revalidate !== false) {
    revalidateCreatorHub();
  }

  return { data };
}

export async function refreshVideoMetrics(id: string) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { data: video, error } = await supabase
    .from("videos")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!video) {
    return { error: "Video not found." };
  }

  const videoUrl = video.title.trim();

  if (!videoUrl) {
    return { error: "Video has no URL." };
  }

  if (!detectVideoPlatform(videoUrl)) {
    return {
      error:
        "Only TikTok and Instagram video links can be refreshed automatically.",
    };
  }

  const detectedPlatform = detectVideoPlatform(videoUrl)!;
  const tikTokPlanCheck = await assertCanFetchTikTokData(
    orgResult.orgId,
    detectedPlatform,
  );
  if ("error" in tikTokPlanCheck) {
    return { error: tikTokPlanCheck.error };
  }

  try {
    return await updateVideoMetricsFromApify(id, videoUrl);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to refresh metrics.",
    };
  }
}

export async function refreshAllVideoMetrics() {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title");

  if (error) {
    return { error: error.message };
  }

  if (!videos?.length) {
    return { data: { refreshed: 0, failed: 0, total: 0 } };
  }

  let refreshed = 0;
  let failed = 0;

  for (const video of videos) {
    const videoUrl = video.title.trim();

    if (!videoUrl || !detectVideoPlatform(videoUrl)) {
      failed += 1;
      continue;
    }

    const detectedPlatform = detectVideoPlatform(videoUrl)!;
    const tikTokPlanCheck = await assertCanFetchTikTokData(
      orgResult.orgId,
      detectedPlatform,
    );
    if ("error" in tikTokPlanCheck) {
      failed += 1;
      continue;
    }

    try {
      const result = await updateVideoMetricsFromApify(video.id, videoUrl, {
        revalidate: false,
      });

      if (result.error) {
        failed += 1;
      } else {
        refreshed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  if (refreshed > 0) {
    revalidateCreatorHub();
  }

  return { data: { refreshed, failed, total: videos.length } };
}

export async function deleteVideo(id: string) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", id)
    .eq("org_id", orgResult.orgId);

  if (error) {
    return { error: error.message };
  }

  revalidateCreatorHub();
  return { success: true };
}
