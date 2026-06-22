"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateContentPlanner } from "@/lib/revalidate";
import {
  type ContentPlannerInput,
  normalizeCampaignId,
  normalizeInspirationUrl,
} from "@/lib/content-planner";
import type { ContentPlannerAgency } from "@/types/database";

const contentPlannerSelect =
  "id, user_id, content_pillar, content_idea, hook, creator_names, campaign_id, planned_date, inspiration_url, platform, status, created_at";

function parseContentPlannerInput(input: ContentPlannerInput) {
  const content_pillar = input.content_pillar.trim();
  const content_idea = input.content_idea.trim();

  if (!content_pillar) {
    return { error: "Content pillar is required." };
  }

  if (!content_idea) {
    return { error: "Content idea / SOW is required." };
  }

  const inspiration = normalizeInspirationUrl(input.inspiration_url ?? "");

  if ("error" in inspiration) {
    return { error: inspiration.error };
  }

  return {
    payload: {
      content_pillar,
      content_idea,
      hook: input.hook.trim(),
      creator_names: (input.creator_names ?? [])
        .map((name) => name.trim())
        .filter(Boolean),
      campaign_id: normalizeCampaignId(input.campaign_id),
      inspiration_url: inspiration.url,
      planned_date: input.planned_date.trim() || null,
      platform: input.platform,
      status: input.status,
    },
  };
}

export async function createContentPlannerItem(input: ContentPlannerInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create content." };
  }

  const parsed = parseContentPlannerInput(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { data, error } = await supabase
    .from("content_planner_agency")
    .insert({
      ...parsed.payload,
      user_id: user.id,
    })
    .select(contentPlannerSelect)
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidateContentPlanner();
  return { data: data as ContentPlannerAgency };
}

export async function updateContentPlannerItem(
  id: string,
  input: ContentPlannerInput,
) {
  if (!id) {
    return { error: "Content item is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update content." };
  }

  const parsed = parseContentPlannerInput(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { data, error } = await supabase
    .from("content_planner_agency")
    .update(parsed.payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(contentPlannerSelect)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Content item not found." };
  }

  revalidateContentPlanner();
  return { data: data as ContentPlannerAgency };
}

export async function deleteContentPlannerItem(id: string) {
  if (!id) {
    return { error: "Content item is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete content." };
  }

  const { error } = await supabase
    .from("content_planner_agency")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateContentPlanner();
  return { success: true };
}
