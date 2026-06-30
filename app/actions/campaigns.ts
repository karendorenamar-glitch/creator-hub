"use server";

import { assertCanCreateResource } from "@/lib/plan-enforcement";
import { canEditCampaign } from "@/lib/org-team";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getOrgIdForAction, getOrgMembershipForAction } from "@/lib/org";
import { revalidateCreatorHub } from "@/lib/revalidate";
import {
  normalizeCampaignCreatorWorkflowStatus,
  type CampaignCreatorWorkflowStatus,
} from "@/lib/campaign-creator-status";
import {
  buildCampaignCreatorInsertPayload,
  isMissingWorkflowStatusColumn,
  type CampaignCreatorLinkRow,
} from "@/lib/campaign-creator-workflow-db";
import {
  isMissingDealTypeColumn,
  normalizeCampaignCreatorDealType,
} from "@/lib/campaign-creator-deal";
import type { CampaignCreatorDealType } from "@/types/database";

export type CampaignInput = {
  name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: CampaignStatus;
  creator_ids?: string[];
  video_ids?: string[];
};

import type { CampaignStatus } from "@/types/database";

export type CampaignCreatorDealUpdate = {
  creator_id: string;
  deal_type: CampaignCreatorDealType;
  fee: number | null;
  deal_value: number | null;
};

function parseCampaignInput(input: CampaignInput) {
  return {
    name: input.name.trim(),
    client_name: input.client_name.trim() || "",
    start_date: input.start_date,
    end_date: input.end_date,
    budget: Math.max(0, input.budget),
    status: input.status,
  };
}

type ExistingCampaignCreatorRow = CampaignCreatorLinkRow;

async function fetchExistingCampaignCreators(campaignId: string) {
  const supabase = await createClient();
  const withWorkflow = await supabase
    .from("campaign_creators")
    .select("creator_id, fee, workflow_status")
    .eq("campaign_id", campaignId);

  if (!withWorkflow.error) {
    return {
      rows: (withWorkflow.data ?? []) as ExistingCampaignCreatorRow[],
      supportsWorkflow: true,
    };
  }

  if (!isMissingWorkflowStatusColumn(withWorkflow.error)) {
    return { error: withWorkflow.error.message };
  }

  const withoutWorkflow = await supabase
    .from("campaign_creators")
    .select("creator_id, fee")
    .eq("campaign_id", campaignId);

  if (withoutWorkflow.error) {
    return { error: withoutWorkflow.error.message };
  }

  return {
    rows: (withoutWorkflow.data ?? []).map((row) => ({
      creator_id: row.creator_id,
      fee: row.fee,
      workflow_status: null,
    })),
    supportsWorkflow: false,
  };
}

async function insertCampaignCreatorRows(
  rows: Array<{
    campaign_id: string;
    creator_id: string;
    fee: number | null;
    workflow_status?: CampaignCreatorWorkflowStatus | null;
  }>,
  supportsWorkflow: boolean,
) {
  const supabase = await createClient();
  const payload = rows.map((row) =>
    buildCampaignCreatorInsertPayload(
      row.campaign_id,
      row.creator_id,
      row,
      supportsWorkflow,
    ),
  );

  const insertResult = await supabase.from("campaign_creators").insert(payload);

  if (!insertResult.error) {
    return { success: true as const };
  }

  if (insertResult.error.code === "23505") {
    return { success: true as const };
  }

  if (!isMissingWorkflowStatusColumn(insertResult.error)) {
    return { error: insertResult.error.message };
  }

  const fallbackResult = await supabase.from("campaign_creators").insert(
    payload.map(({ campaign_id, creator_id, fee }) => ({
      campaign_id,
      creator_id,
      fee,
    })),
  );

  if (!fallbackResult.error) {
    return { success: true as const };
  }

  if (fallbackResult.error.code === "23505") {
    return { success: true as const };
  }

  return { error: fallbackResult.error.message };
}

async function syncCampaignRelations(
  campaignId: string,
  creatorIds: string[],
  videoIds: string[],
) {
  const supabase = await createClient();
  const existingResult = await fetchExistingCampaignCreators(campaignId);

  if ("error" in existingResult) {
    return { error: existingResult.error };
  }

  const existingByCreator = new Map(
    existingResult.rows.map((row) => [row.creator_id, row]),
  );

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
    const insertResult = await insertCampaignCreatorRows(
      creatorIds.map((creator_id) => {
        const existing = existingByCreator.get(creator_id);

        return {
          campaign_id: campaignId,
          creator_id,
          fee: existing?.fee ?? null,
          workflow_status: existing?.workflow_status ?? "brief_sent",
        };
      }),
      existingResult.supportsWorkflow,
    );

    if ("error" in insertResult) {
      return { error: insertResult.error };
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

export async function linkVideoToCampaign(
  campaignId: string,
  videoId: string,
  creatorId: string,
  options?: { revalidate?: boolean },
) {
  if (!campaignId) {
    return { error: "Campaign is required." };
  }

  if (!videoId) {
    return { error: "Video is required." };
  }

  if (!creatorId) {
    return { error: "Creator is required." };
  }

  const supabase = await createClient();

  const { error: videoError } = await supabase.from("campaign_videos").insert({
    campaign_id: campaignId,
    video_id: videoId,
  });

  if (videoError && videoError.code !== "23505") {
    return { error: videoError.message };
  }

  const { data: existingCreator, error: existingCreatorError } = await supabase
    .from("campaign_creators")
    .select("fee")
    .eq("campaign_id", campaignId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (existingCreatorError && !isMissingWorkflowStatusColumn(existingCreatorError)) {
    return { error: existingCreatorError.message };
  }

  const { error: creatorError } = await supabase.from("campaign_creators").upsert(
    {
      campaign_id: campaignId,
      creator_id: creatorId,
      fee: existingCreator?.fee ?? null,
      workflow_status: "posted",
    },
    { onConflict: "campaign_id,creator_id" },
  );

  if (creatorError) {
    if (isMissingWorkflowStatusColumn(creatorError)) {
      const fallbackResult = await insertCampaignCreatorRows(
        [
          {
            campaign_id: campaignId,
            creator_id: creatorId,
            fee: existingCreator?.fee ?? null,
          },
        ],
        false,
      );

      if ("error" in fallbackResult) {
        return { error: fallbackResult.error };
      }
    } else {
      return { error: creatorError.message };
    }
  }

  if (options?.revalidate !== false) {
    revalidateCreatorHub(campaignId);
  }

  return { success: true };
}

export async function linkCreatorToCampaign(
  campaignId: string,
  creatorId: string,
  options?: { revalidate?: boolean },
) {
  if (!campaignId) {
    return { error: "Campaign is required." };
  }

  if (!creatorId) {
    return { error: "Creator is required." };
  }

  const creatorResult = await insertCampaignCreatorRows(
    [
      {
        campaign_id: campaignId,
        creator_id: creatorId,
        fee: null,
        workflow_status: "brief_sent",
      },
    ],
    true,
  );

  if ("error" in creatorResult) {
    return { error: creatorResult.error };
  }

  if (options?.revalidate !== false) {
    revalidateCreatorHub(campaignId);
  }

  return { success: true };
}

export async function unlinkCreatorFromCampaign(
  campaignId: string,
  creatorId: string,
) {
  if (!campaignId) {
    return { error: "Campaign is required." };
  }

  if (!creatorId) {
    return { error: "Creator is required." };
  }

  const access = await assertCanModifyCampaign(campaignId);
  if ("error" in access) {
    return { error: access.error };
  }

  const supabase = await createClient();

  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("org_id", access.orgId);

  if (videosError) {
    return { error: videosError.message };
  }

  const videoIds = (videos ?? []).map((video) => video.id);

  if (videoIds.length > 0) {
    const { error: unlinkVideosError } = await supabase
      .from("campaign_videos")
      .delete()
      .eq("campaign_id", campaignId)
      .in("video_id", videoIds);

    if (unlinkVideosError) {
      return { error: unlinkVideosError.message };
    }
  }

  const { error: unlinkCreatorError } = await supabase
    .from("campaign_creators")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("creator_id", creatorId);

  if (unlinkCreatorError) {
    return { error: unlinkCreatorError.message };
  }

  revalidateCreatorHub(campaignId);
  return { success: true as const };
}

export async function unlinkVideoFromCampaign(
  campaignId: string,
  videoId: string,
) {
  if (!campaignId) {
    return { error: "Campaign is required." };
  }

  if (!videoId) {
    return { error: "Video is required." };
  }

  const access = await assertCanModifyCampaign(campaignId);
  if ("error" in access) {
    return { error: access.error };
  }

  const supabase = await createClient();

  const { data: link, error: linkError } = await supabase
    .from("campaign_videos")
    .select("video_id, videos!inner(org_id)")
    .eq("campaign_id", campaignId)
    .eq("video_id", videoId)
    .maybeSingle();

  if (linkError) {
    return { error: linkError.message };
  }

  if (!link) {
    return { error: "Video is not linked to this campaign." };
  }

  const video = link.videos as { org_id: string } | null;
  if (!video || video.org_id !== access.orgId) {
    return { error: "Video not found." };
  }

  const { error } = await supabase
    .from("campaign_videos")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("video_id", videoId);

  if (error) {
    return { error: error.message };
  }

  revalidateCreatorHub(campaignId);
  return { success: true as const };
}

export async function syncCreatorCampaigns(
  creatorId: string,
  campaignIds: string[],
  options?: { revalidate?: boolean },
) {
  if (!creatorId) {
    return { error: "Creator is required." };
  }

  const supabase = await createClient();
  const uniqueCampaignIds = [...new Set(campaignIds.filter(Boolean))];

  const { error: deleteError } = await supabase
    .from("campaign_creators")
    .delete()
    .eq("creator_id", creatorId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (uniqueCampaignIds.length === 0) {
    if (options?.revalidate !== false) {
      revalidateCreatorHub();
    }
    return { success: true };
  }

  const insertResult = await insertCampaignCreatorRows(
    uniqueCampaignIds.map((campaign_id) => ({
      campaign_id,
      creator_id: creatorId,
      fee: null,
      workflow_status: "brief_sent",
    })),
    true,
  );

  if ("error" in insertResult) {
    return { error: insertResult.error };
  }

  if (options?.revalidate !== false) {
    revalidateCreatorHub();
  }

  return { success: true };
}

async function assertCanModifyCampaign(campaignId: string) {
  const membership = await getOrgMembershipForAction();
  if ("error" in membership) {
    return { error: membership.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, created_by")
    .eq("id", campaignId)
    .eq("org_id", membership.orgId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Campaign not found." };
  }

  if (
    !canEditCampaign({
      role: membership.role,
      userId: membership.userId,
      createdBy: data.created_by,
    })
  ) {
    return {
      error: "You can only edit campaigns that you created.",
    };
  }

  return { orgId: membership.orgId };
}

export async function createCampaign(input: CampaignInput) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const user = await getAuthUser();

  const limitCheck = await assertCanCreateResource(orgResult.orgId, "campaigns");
  if ("error" in limitCheck) {
    return { error: limitCheck.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      ...parseCampaignInput(input),
      org_id: orgResult.orgId,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  const syncResult = await syncCampaignRelations(
    data.id,
    input.creator_ids ?? [],
    input.video_ids ?? [],
  );

  if (syncResult.error) {
    await supabase.from("campaigns").delete().eq("id", data.id);
    return { error: syncResult.error };
  }

  revalidateCreatorHub(data.id);
  return { data };
}

export async function updateCampaign(id: string, input: CampaignInput) {
  const access = await assertCanModifyCampaign(id);
  if ("error" in access) {
    return { error: access.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .update(parseCampaignInput(input))
    .eq("id", id)
    .eq("org_id", access.orgId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (input.creator_ids !== undefined && input.video_ids !== undefined) {
    const syncResult = await syncCampaignRelations(
      id,
      input.creator_ids,
      input.video_ids,
    );

    if (syncResult.error) {
      return { error: syncResult.error };
    }
  }

  revalidateCreatorHub(id);
  return { data };
}

export async function deleteCampaign(id: string) {
  const access = await assertCanModifyCampaign(id);
  if ("error" in access) {
    return { error: access.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("org_id", access.orgId);

  if (error) {
    return { error: error.message };
  }

  revalidateCreatorHub(id);
  return { success: true };
}

export async function bulkUpdateCampaignCreatorDeals(
  campaignId: string,
  updates: CampaignCreatorDealUpdate[],
) {
  if (!campaignId) {
    return { error: "Campaign id is required." };
  }

  if (!updates.length) {
    return { error: "No creator deals to update." };
  }

  const supabase = await createClient();

  for (const update of updates) {
    if (!update.creator_id) {
      return { error: "Creator id is required." };
    }

    const dealType = normalizeCampaignCreatorDealType(update.deal_type);
    const payload = {
      campaign_id: campaignId,
      creator_id: update.creator_id,
      deal_type: dealType,
      fee: dealType === "paid" ? update.fee : null,
      deal_value:
        dealType === "barter" || dealType === "voucher" ? update.deal_value : null,
    };

    const { data: existing, error: existingError } = await supabase
      .from("campaign_creators")
      .select("workflow_status")
      .eq("campaign_id", campaignId)
      .eq("creator_id", update.creator_id)
      .maybeSingle();

    if (isMissingWorkflowStatusColumn(existingError)) {
      const { error: fallbackError } = await supabase
        .from("campaign_creators")
        .upsert(payload, { onConflict: "campaign_id,creator_id" });

      if (fallbackError && isMissingDealTypeColumn(fallbackError.message)) {
        const { error: legacyError } = await supabase
          .from("campaign_creators")
          .upsert(
            {
              campaign_id: campaignId,
              creator_id: update.creator_id,
              fee: payload.fee,
            },
            { onConflict: "campaign_id,creator_id" },
          );

        if (legacyError) {
          return { error: legacyError.message };
        }
      } else if (fallbackError) {
        return { error: fallbackError.message };
      }

      continue;
    }

    const { error } = await supabase.from("campaign_creators").upsert(
      {
        ...payload,
        workflow_status: normalizeCampaignCreatorWorkflowStatus(
          existing?.workflow_status,
        ),
      },
      { onConflict: "campaign_id,creator_id" },
    );

    if (error) {
      if (isMissingWorkflowStatusColumn(error)) {
        const { error: fallbackError } = await supabase
          .from("campaign_creators")
          .upsert(payload, { onConflict: "campaign_id,creator_id" });

        if (fallbackError && isMissingDealTypeColumn(fallbackError.message)) {
          const { error: legacyError } = await supabase
            .from("campaign_creators")
            .upsert(
              {
                campaign_id: campaignId,
                creator_id: update.creator_id,
                fee: payload.fee,
              },
              { onConflict: "campaign_id,creator_id" },
            );

          if (legacyError) {
            return { error: legacyError.message };
          }
        } else if (fallbackError) {
          return { error: fallbackError.message };
        }

        continue;
      }

      if (isMissingDealTypeColumn(error.message)) {
        const { error: legacyError } = await supabase
          .from("campaign_creators")
          .upsert(
            {
              campaign_id: campaignId,
              creator_id: update.creator_id,
              fee: payload.fee,
              workflow_status: normalizeCampaignCreatorWorkflowStatus(
                existing?.workflow_status,
              ),
            },
            { onConflict: "campaign_id,creator_id" },
          );

        if (legacyError) {
          return { error: legacyError.message };
        }

        continue;
      }

      return { error: error.message };
    }
  }

  revalidateCreatorHub(campaignId);
  return { success: true, updated: updates.length };
}

/** @deprecated Use bulkUpdateCampaignCreatorDeals */
export async function bulkUpdateCampaignCreatorFees(
  campaignId: string,
  updates: Array<{ creator_id: string; fee: number | null }>,
) {
  return bulkUpdateCampaignCreatorDeals(
    campaignId,
    updates.map((update) => ({
      creator_id: update.creator_id,
      deal_type: "paid",
      fee: update.fee,
      deal_value: null,
    })),
  );
}

export async function updateCampaignCreatorWorkflowStatus(
  campaignId: string,
  creatorId: string,
  workflowStatus: CampaignCreatorWorkflowStatus,
) {
  if (!campaignId) {
    return { error: "Campaign id is required." };
  }

  if (!creatorId) {
    return { error: "Creator id is required." };
  }

  const normalizedStatus = normalizeCampaignCreatorWorkflowStatus(workflowStatus);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("campaign_creators")
    .select("fee")
    .eq("campaign_id", campaignId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  const { error } = await supabase.from("campaign_creators").upsert(
    {
      campaign_id: campaignId,
      creator_id: creatorId,
      fee: existing?.fee ?? null,
      workflow_status: normalizedStatus,
    },
    { onConflict: "campaign_id,creator_id" },
  );

  if (error) {
    if (isMissingWorkflowStatusColumn(error)) {
      return {
        error:
          "Creator status is not set up yet. Run supabase/campaign-creator-workflow-status.sql in the Supabase SQL Editor.",
      };
    }

    return { error: error.message };
  }

  revalidateCreatorHub(campaignId);
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
