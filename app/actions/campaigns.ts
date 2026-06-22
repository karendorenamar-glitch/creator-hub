"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateCreatorHub } from "@/lib/revalidate";
import type { CampaignStatus } from "@/types/database";

export type CampaignInput = {
  name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: CampaignStatus;
  creator_ids: string[];
  video_ids: string[];
};

function parseCampaignInput(input: CampaignInput) {
  return {
    name: input.name.trim(),
    client_name: input.client_name.trim(),
    start_date: input.start_date,
    end_date: input.end_date,
    budget: Math.max(0, input.budget),
    status: input.status,
  };
}

async function syncCampaignRelations(
  campaignId: string,
  creatorIds: string[],
  videoIds: string[],
) {
  const supabase = await createClient();

  const [creatorsResult, videosResult] = await Promise.all([
    supabase.from("campaign_creators").delete().eq("campaign_id", campaignId),
    supabase.from("campaign_videos").delete().eq("campaign_id", campaignId),
  ]);

  if (creatorsResult.error) {
    return { error: creatorsResult.error.message };
  }

  if (videosResult.error) {
    return { error: videosResult.error.message };
  }

  if (creatorIds.length > 0) {
    const { error } = await supabase.from("campaign_creators").insert(
      creatorIds.map((creator_id) => ({
        campaign_id: campaignId,
        creator_id,
      })),
    );

    if (error) {
      return { error: error.message };
    }
  }

  if (videoIds.length > 0) {
    const { error } = await supabase.from("campaign_videos").insert(
      videoIds.map((video_id) => ({
        campaign_id: campaignId,
        video_id,
      })),
    );

    if (error) {
      return { error: error.message };
    }
  }

  return { success: true };
}

export async function createCampaign(input: CampaignInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .insert(parseCampaignInput(input))
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  const syncResult = await syncCampaignRelations(
    data.id,
    input.creator_ids,
    input.video_ids,
  );

  if (syncResult.error) {
    await supabase.from("campaigns").delete().eq("id", data.id);
    return { error: syncResult.error };
  }

  revalidateCreatorHub(data.id);
  return { data };
}

export async function updateCampaign(id: string, input: CampaignInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .update(parseCampaignInput(input))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  const syncResult = await syncCampaignRelations(
    id,
    input.creator_ids,
    input.video_ids,
  );

  if (syncResult.error) {
    return { error: syncResult.error };
  }

  revalidateCreatorHub(id);
  return { data };
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateCreatorHub(id);
  return { success: true };
}

export async function getCampaignRelationIds(id: string) {
  const supabase = await createClient();

  const [creatorsResult, videosResult] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("creator_id")
      .eq("campaign_id", id),
    supabase.from("campaign_videos").select("video_id").eq("campaign_id", id),
  ]);

  return {
    creator_ids: (creatorsResult.data ?? []).map((row) => row.creator_id),
    video_ids: (videosResult.data ?? []).map((row) => row.video_id),
  };
}
