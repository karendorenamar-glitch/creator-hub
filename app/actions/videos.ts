"use server";

import { linkVideoToCampaign } from "@/app/actions/campaigns";
import { findOrCreateCreatorForTikTokUsername, syncCreatorTikTokUsername } from "@/app/actions/creators";
import { fetchTikTokMetrics, fetchTikTokVideoData } from "@/lib/apify";
import { createClient } from "@/lib/supabase/server";
import { revalidateCreatorHub } from "@/lib/revalidate";
import { extractTikTokUsernameFromUrl } from "@/lib/tiktok-url";

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

async function applyCreatorUsernameFromVideo(
  creatorId: string,
  videoUrl: string,
  authorUsername?: string | null,
) {
  const username =
    authorUsername ?? extractTikTokUsernameFromUrl(videoUrl);
  await syncCreatorTikTokUsername(creatorId, username);
}

export async function createVideo(
  input: VideoInput,
  options?: { revalidate?: boolean; authorUsername?: string | null },
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .insert(parseVideoInput(input))
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await applyCreatorUsernameFromVideo(
    input.creator_id,
    input.video_url,
    options?.authorUsername,
  );

  if (options?.revalidate !== false) {
    revalidateCreatorHub();
  }
  return { data };
}

export async function createVideoFromUrl(input: {
  creator_id?: string;
  video_url: string;
  platform?: string;
  campaign_id?: string;
  import_metrics?: boolean;
  auto_create_creator?: boolean;
  revalidate?: boolean;
}) {
  const trimmedUrl = input.video_url.trim();

  if (!trimmedUrl) {
    return { error: "TikTok URL is required." };
  }

  let authorUsername: string | null = extractTikTokUsernameFromUrl(trimmedUrl);
  let authorDisplayName: string | null = null;
  let authorFollowers = 0;
  let metrics = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  };

  if (input.import_metrics !== false) {
    try {
      const videoData = await fetchTikTokVideoData(trimmedUrl);
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
  }

  let creatorId = input.creator_id;
  let createdCreator = false;

  if (!creatorId) {
    if (!authorUsername) {
      return {
        error:
          "Could not detect the TikTok creator from this link. Use a full @username/video/... URL or enable metric import.",
      };
    }

    const match = await findOrCreateCreatorForTikTokUsername(authorUsername, {
      platform: input.platform ?? "TikTok",
      displayName: authorDisplayName,
      followers: authorFollowers,
      autoCreate: input.auto_create_creator !== false,
      revalidate: false,
    });

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
    { revalidate: false, authorUsername },
  );

  if (result.error || !result.data) {
    return result;
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

export async function updateVideo(id: string, input: VideoInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .update(parseVideoInput(input))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await applyCreatorUsernameFromVideo(input.creator_id, input.video_url);

  revalidateCreatorHub();
  return { data };
}

export async function importVideoMetrics(videoUrl: string) {
  const trimmedUrl = videoUrl.trim();

  if (!trimmedUrl) {
    return { error: "TikTok URL is required." };
  }

  try {
    const metrics = await fetchTikTokMetrics(trimmedUrl);
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
  const videoData = await fetchTikTokVideoData(videoUrl);
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
    await applyCreatorUsernameFromVideo(
      video.creator_id,
      videoUrl,
      videoData.authorUsername,
    );
  }

  if (options?.revalidate !== false) {
    revalidateCreatorHub();
  }

  return { data };
}

export async function refreshVideoMetrics(id: string) {
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
    return { error: "Video has no TikTok URL." };
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

    if (!videoUrl) {
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
  const supabase = await createClient();

  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateCreatorHub();
  return { success: true };
}
