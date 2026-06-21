"use server";

import { fetchTikTokMetrics } from "@/lib/apify";
import { createClient } from "@/lib/supabase/server";
import { revalidateCreatorHub } from "@/lib/revalidate";

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

export async function createVideo(input: VideoInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .insert(parseVideoInput(input))
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidateCreatorHub();
  return { data };
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
  const metrics = await fetchTikTokMetrics(videoUrl);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .update({
      views: metrics.views,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saves,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
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
