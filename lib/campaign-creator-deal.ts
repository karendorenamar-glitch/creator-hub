import { parseIDRInput } from "@/lib/utils";
import type { CampaignCreator, CampaignCreatorDealType } from "@/types/database";

export const CAMPAIGN_CREATOR_DEAL_TYPES = [
  "paid",
  "barter",
  "voucher",
] as const;

export function normalizeCampaignCreatorDealType(
  value: string | null | undefined,
): CampaignCreatorDealType {
  if (value === "barter" || value === "voucher") {
    return value;
  }

  return "paid";
}

export function isMissingDealTypeColumn(message: string | null | undefined) {
  return Boolean(message?.includes("deal_type"));
}

export function getCampaignCreatorDealAmount(creator: CampaignCreator) {
  const dealType = creator.deal_type ?? "paid";

  if (dealType === "paid") {
    return creator.campaign_fee ?? creator.fee;
  }

  return creator.deal_value ?? 0;
}

export function parseDealAmountInput(
  value: string | null | undefined,
): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = parseIDRInput(value);

  if (parsed < 0) {
    return null;
  }

  return parsed;
}

export function formatDealAmountLabel(dealType: CampaignCreatorDealType) {
  return dealType === "paid" ? "Fee" : "Value";
}
