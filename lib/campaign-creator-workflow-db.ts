type SupabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

import type { CampaignCreatorWorkflowStatus } from "@/types/database";
import { normalizeCampaignCreatorWorkflowStatus } from "@/lib/campaign-creator-status";

export function isMissingWorkflowStatusColumn(error: SupabaseErrorLike) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("workflow_status") === true
  );
}

export type CampaignCreatorLinkRow = {
  creator_id: string;
  fee: number | null;
  workflow_status?: CampaignCreatorWorkflowStatus | null;
};

export function buildCampaignCreatorInsertPayload(
  campaignId: string,
  creatorId: string,
  existing?: CampaignCreatorLinkRow,
  includeWorkflowStatus = true,
) {
  const row: {
    campaign_id: string;
    creator_id: string;
    fee: number | null;
    workflow_status?: CampaignCreatorWorkflowStatus | null;
  } = {
    campaign_id: campaignId,
    creator_id: creatorId,
    fee: existing?.fee ?? null,
  };

  if (includeWorkflowStatus) {
    row.workflow_status = normalizeCampaignCreatorWorkflowStatus(
      existing?.workflow_status,
    );
  }

  return row;
}
