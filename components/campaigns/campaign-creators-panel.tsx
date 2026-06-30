"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Users } from "lucide-react";
import { bulkUpdateCampaignCreatorDeals } from "@/app/actions/campaigns";
import { CampaignCreatorDetailSection } from "@/components/campaigns/campaign-creator-detail-section";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { buildCampaignCreatorPerformance } from "@/lib/campaign-creator-performance";
import {
  CAMPAIGN_CREATOR_DEAL_TYPES,
  normalizeCampaignCreatorDealType,
} from "@/lib/campaign-creator-deal";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableElement,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EmptyState,
} from "@/components/ui/data-table";
import {
  calculateEngagementRate,
  formatCompactFee,
  formatCreatorListUsername,
  formatEngagementRate,
  formatIDR,
  formatNumber,
  parseCompactFee,
} from "@/lib/utils";
import type { CampaignCreator, CampaignCreatorDealType, CampaignDetail } from "@/types/database";

type CampaignCreatorsPanelProps = {
  campaign: CampaignDetail;
};

const DEAL_TYPE_LABELS: Record<CampaignCreatorDealType, string> = {
  paid: "Paid",
  barter: "Barter",
  voucher: "Voucher",
};

function effectivePaidFee(creator: CampaignCreator) {
  return creator.campaign_fee ?? creator.fee;
}

function paidFeeInputValue(creator: CampaignCreator) {
  const fee = effectivePaidFee(creator);
  return fee > 0 ? formatCompactFee(fee) : "";
}

function valueInputValue(creator: CampaignCreator) {
  return creator.deal_value && creator.deal_value > 0
    ? formatCompactFee(creator.deal_value)
    : "";
}

function parseAmountInput(value: string) {
  return parseCompactFee(value);
}

type CreatorPerformanceStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

function emptyCreatorStats(): CreatorPerformanceStats {
  return {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  };
}

function CreatorAvatar({ creator }: { creator: CampaignCreator }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kefoo-100 text-sm font-semibold text-kefoo-700">
      {creator.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function CampaignCreatorsPanel({ campaign }: CampaignCreatorsPanelProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [dealTypes, setDealTypes] = useState<Record<string, CampaignCreatorDealType>>(
    {},
  );
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});
  const [bulkFeeInput, setBulkFeeInput] = useState("");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  const selectedCreatorDetail = useMemo(() => {
    if (!selectedCreatorId) {
      return null;
    }

    return buildCampaignCreatorPerformance(campaign, selectedCreatorId);
  }, [campaign, selectedCreatorId]);

  useEffect(() => {
    setDealTypes(
      Object.fromEntries(
        campaign.creators.map((creator) => [
          creator.id,
          normalizeCampaignCreatorDealType(creator.deal_type),
        ]),
      ),
    );
    setFeeInputs(
      Object.fromEntries(
        campaign.creators.map((creator) => [creator.id, paidFeeInputValue(creator)]),
      ),
    );
    setValueInputs(
      Object.fromEntries(
        campaign.creators.map((creator) => [creator.id, valueInputValue(creator)]),
      ),
    );
  }, [campaign.creators]);

  const statsByCreator = useMemo(() => {
    const map = new Map<string, CreatorPerformanceStats>();

    for (const video of campaign.videos) {
      const existing = map.get(video.creator_id) ?? emptyCreatorStats();

      map.set(video.creator_id, {
        views: existing.views + video.views,
        likes: existing.likes + video.likes,
        comments: existing.comments + video.comments,
        shares: existing.shares + video.shares,
        saves: existing.saves + video.saves,
      });
    }

    return map;
  }, [campaign.videos]);

  const sortedCreators = useMemo(
    () =>
      [...campaign.creators].sort(
        (left, right) =>
          (statsByCreator.get(right.id)?.views ?? 0) -
          (statsByCreator.get(left.id)?.views ?? 0),
      ),
    [campaign.creators, statsByCreator],
  );

  const hasPaidCreators = sortedCreators.some(
    (creator) => (dealTypes[creator.id] ?? creator.deal_type) === "paid",
  );

  const hasChanges = campaign.creators.some((creator) => {
    const dealType =
      dealTypes[creator.id] ?? normalizeCampaignCreatorDealType(creator.deal_type);
    const savedDealType = normalizeCampaignCreatorDealType(creator.deal_type);

    if (dealType !== savedDealType) {
      return true;
    }

    if (dealType === "paid") {
      const input = feeInputs[creator.id] ?? paidFeeInputValue(creator);
      const parsed = input.trim() ? parseAmountInput(input) : 0;
      const savedFee = creator.campaign_fee ?? (creator.fee > 0 ? creator.fee : null);

      if (savedFee == null) {
        return parsed > 0;
      }

      return parsed !== savedFee;
    }

    const input = valueInputs[creator.id] ?? valueInputValue(creator);
    const parsed = input.trim() ? parseAmountInput(input) : null;
    const savedValue = creator.deal_value;

    if (savedValue == null) {
      return parsed != null && parsed > 0;
    }

    return parsed !== savedValue;
  });

  function handleDealTypeChange(
    creator: CampaignCreator,
    nextDealType: CampaignCreatorDealType,
  ) {
    setDealTypes((current) => ({
      ...current,
      [creator.id]: nextDealType,
    }));

    if (nextDealType === "paid") {
      setFeeInputs((current) => {
        const existing = current[creator.id] ?? "";

        if (existing.trim()) {
          return current;
        }

        return {
          ...current,
          [creator.id]: paidFeeInputValue(creator),
        };
      });
    }
  }

  function applyBulkFee() {
    const fee = parseAmountInput(bulkFeeInput);

    if (!bulkFeeInput.trim() || fee < 0) {
      showError("Enter a valid fee to apply (e.g. 1.5M or 500K).");
      return;
    }

    setFeeInputs((current) => {
      const next = { ...current };

      for (const creator of campaign.creators) {
        const dealType =
          dealTypes[creator.id] ?? normalizeCampaignCreatorDealType(creator.deal_type);

        if (dealType === "paid") {
          next[creator.id] = formatCompactFee(fee);
        }
      }

      return next;
    });
  }

  function handleSaveDeals() {
    const updates = campaign.creators.map((creator) => {
      const dealType =
        dealTypes[creator.id] ?? normalizeCampaignCreatorDealType(creator.deal_type);

      if (dealType === "paid") {
        const raw = feeInputs[creator.id] ?? paidFeeInputValue(creator);

        if (!raw.trim()) {
          return {
            creator_id: creator.id,
            deal_type: dealType,
            fee: null,
            deal_value: null,
            error: null,
          };
        }

        const fee = parseAmountInput(raw);

        if (fee < 0) {
          return {
            creator_id: creator.id,
            deal_type: dealType,
            fee: null,
            deal_value: null,
            error: "Invalid fee.",
          };
        }

        return {
          creator_id: creator.id,
          deal_type: dealType,
          fee,
          deal_value: null,
          error: null,
        };
      }

      const raw = valueInputs[creator.id] ?? valueInputValue(creator);

      if (!raw.trim()) {
        return {
          creator_id: creator.id,
          deal_type: dealType,
          fee: null,
          deal_value: null,
          error: null,
        };
      }

      const dealValue = parseAmountInput(raw);

      if (dealValue < 0) {
        return {
          creator_id: creator.id,
          deal_type: dealType,
          fee: null,
          deal_value: null,
          error: "Invalid value.",
        };
      }

      return {
        creator_id: creator.id,
        deal_type: dealType,
        fee: null,
        deal_value: dealValue,
        error: null,
      };
    });

    for (const update of updates) {
      if (update.error) {
        const creator = campaign.creators.find(
          (item) => item.id === update.creator_id,
        );
        showError(`${creator?.name ?? "Creator"}: ${update.error}`);
        return;
      }
    }

    startSaveTransition(async () => {
      const result = await bulkUpdateCampaignCreatorDeals(
        campaign.id,
        updates.map(({ creator_id, deal_type, fee, deal_value }) => ({
          creator_id,
          deal_type,
          fee,
          deal_value,
        })),
      );

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(
        `Updated deals for ${result.updated} creator${result.updated === 1 ? "" : "s"}.`,
      );
      router.refresh();
    });
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">
              Creator performance
            </h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Per-creator views, engagement rate, and deal terms for this campaign.
            Use the view icon to open campaign-specific creator details.
          </p>
        </div>

        {campaign.creators.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {hasPaidCreators ? (
              <div className="flex items-center gap-2">
                <label htmlFor="bulk-creator-fee" className="sr-only">
                  Apply fee to all paid creators
                </label>
                <input
                  id="bulk-creator-fee"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 1.5M"
                  value={bulkFeeInput}
                  onChange={(event) => setBulkFeeInput(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 sm:w-40"
                />
                <button
                  type="button"
                  onClick={applyBulkFee}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Apply to paid
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSaveDeals}
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-kefoo-400 px-4 py-2 text-sm font-medium text-white hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save deals"}
            </button>
          </div>
        )}
      </div>

      {campaign.creators.length === 0 ? (
        <DataTable>
          <EmptyState
            title="No creators linked yet"
            description={
              campaign.videos.length > 0
                ? "Creators from linked videos will appear here automatically."
                : "Add creators and videos from the Content tab."
            }
          />
        </DataTable>
      ) : (
        <DataTable>
          <DataTableElement>
            <DataTableHead>
              <DataTableHeaderCell>Creator</DataTableHeaderCell>
              <DataTableHeaderCell>Username</DataTableHeaderCell>
              <DataTableHeaderCell>Platform</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Views</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">ER%</DataTableHeaderCell>
              <DataTableHeaderCell>Deal type</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Fee / Value</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {sortedCreators.map((creator) => {
                const stats = statsByCreator.get(creator.id) ?? emptyCreatorStats();
                const dealType =
                  dealTypes[creator.id] ??
                  normalizeCampaignCreatorDealType(creator.deal_type);
                const feeInput = feeInputs[creator.id] ?? paidFeeInputValue(creator);
                const valueInput = valueInputs[creator.id] ?? valueInputValue(creator);
                const engagementRate = calculateEngagementRate(
                  stats.views,
                  stats.likes,
                  stats.comments,
                  stats.shares,
                  stats.saves,
                );

                return (
                  <DataTableRow key={creator.id}>
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <CreatorAvatar creator={creator} />
                        <span className="font-medium text-slate-900">
                          {creator.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCreatorId(creator.id)}
                          className="inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-kefoo-50 hover:text-kefoo-600"
                          aria-label={`View ${creator.name} campaign details`}
                          title="View creator details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {formatCreatorListUsername(creator)}
                    </DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {creator.platform}
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-right text-slate-600">
                      {formatNumber(stats.views)}
                    </DataTableCell>
                    <DataTableCell className="text-right text-slate-600">
                      {stats.views > 0
                        ? formatEngagementRate(engagementRate)
                        : "—"}
                    </DataTableCell>
                    <DataTableCell>
                      <select
                        value={dealType}
                        onChange={(event) =>
                          handleDealTypeChange(
                            creator,
                            event.target.value as CampaignCreatorDealType,
                          )
                        }
                        aria-label={`Deal type for ${creator.name}`}
                        className="w-full min-w-[7rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20"
                      >
                        {CAMPAIGN_CREATOR_DEAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {DEAL_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      {dealType === "paid" ? (
                        <>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={feeInput}
                            placeholder="e.g. 500K"
                            onChange={(event) =>
                              setFeeInputs((current) => ({
                                ...current,
                                [creator.id]: event.target.value,
                              }))
                            }
                            aria-label={`Fee for ${creator.name}`}
                            className="w-full min-w-[8rem] rounded-lg border border-slate-300 px-3 py-2 text-right text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20"
                          />
                          {creator.campaign_fee != null &&
                          feeInput !== paidFeeInputValue(creator) ? (
                            <p className="mt-1 text-xs text-slate-400">
                              Was {formatIDR(creator.campaign_fee)}
                            </p>
                          ) : creator.campaign_fee == null && creator.fee > 0 ? (
                            <p className="mt-1 text-xs text-slate-400">
                              From creator default
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={valueInput}
                            placeholder="Optional"
                            onChange={(event) =>
                              setValueInputs((current) => ({
                                ...current,
                                [creator.id]: event.target.value,
                              }))
                            }
                            aria-label={`Value for ${creator.name}`}
                            className="w-full min-w-[8rem] rounded-lg border border-slate-300 px-3 py-2 text-right text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20"
                          />
                          {creator.deal_value != null &&
                          valueInput !== valueInputValue(creator) ? (
                            <p className="mt-1 text-xs text-slate-400">
                              Was {formatIDR(creator.deal_value)}
                            </p>
                          ) : null}
                        </>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTableElement>
        </DataTable>
      )}

      <Drawer
        open={selectedCreatorId !== null}
        onClose={() => setSelectedCreatorId(null)}
        size="xl"
        title={selectedCreatorDetail?.creator.name ?? "Creator performance"}
        description={
          selectedCreatorDetail
            ? `${selectedCreatorDetail.campaign.name} · campaign performance`
            : undefined
        }
      >
        {selectedCreatorDetail ? (
          <CampaignCreatorDetailSection
            detail={selectedCreatorDetail}
            embedded
          />
        ) : (
          <p className="text-sm text-slate-500">
            No performance data found for this creator in this campaign.
          </p>
        )}
      </Drawer>
    </section>
  );
}
