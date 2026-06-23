export const CAMPAIGN_TYPES = ["bulk", "personal"] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_CREATOR_WORKFLOW_STATUSES = [
  "brief_sent",
  "waiting_content",
  "revision",
  "posted",
] as const;

export type CampaignCreatorWorkflowStatus =
  (typeof CAMPAIGN_CREATOR_WORKFLOW_STATUSES)[number];

export const CAMPAIGN_CREATOR_WORKFLOW_LABELS: Record<
  CampaignCreatorWorkflowStatus,
  string
> = {
  brief_sent: "Brief Sent",
  waiting_content: "Waiting content",
  revision: "Revision",
  posted: "Posted",
};

export const EXECUTION_TRACKER_STATUS_LABELS: Record<
  CampaignCreatorWorkflowStatus,
  string
> = {
  brief_sent: "Brief",
  waiting_content: "Waiting content",
  revision: "Revision",
  posted: "Uploaded",
};

export const EXECUTION_TRACKER_STATUS_SUMMARY: Array<{
  status: CampaignCreatorWorkflowStatus;
  label: string;
}> = [
  { status: "brief_sent", label: "Brief" },
  { status: "waiting_content", label: "Waiting content" },
  { status: "revision", label: "Revision" },
  { status: "posted", label: "Uploaded" },
];

export function normalizeCampaignType(
  value: string | null | undefined,
): CampaignType {
  if (value?.toLowerCase() === "personal") {
    return "personal";
  }

  return "bulk";
}

export function formatCampaignTypeLabel(type: CampaignType): string {
  return type === "personal" ? "Personal" : "Bulk";
}

export function normalizeCampaignCreatorWorkflowStatus(
  value: string | null | undefined,
): CampaignCreatorWorkflowStatus {
  const match = CAMPAIGN_CREATOR_WORKFLOW_STATUSES.find(
    (status) => status === value,
  );

  return match ?? "brief_sent";
}
