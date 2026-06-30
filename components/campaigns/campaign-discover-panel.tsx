"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  addDiscoveredVideosToCampaign,
  getDiscoverScanStatus,
  scanCampaignCreatorsByKeywords,
} from "@/app/actions/campaign-discover";
import { FormError, FormField, inputClassName } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  MAX_DISCOVER_CREATORS,
  MAX_DISCOVER_KEYWORDS,
  buildDiscoverCreatorHandlesText,
  type DiscoverCreatorResult,
  parseDiscoverKeywords,
  parseTikTokCreatorHandles,
} from "@/lib/campaign-discover";
import {
  DISCOVER_WEEKLY_LIMIT_NOTICE,
  estimateDiscoverScanSeconds,
  formatDiscoverScanCooldownMessage,
  formatDiscoverScanInProgressMessage,
  formatDiscoverScanWaitDuration,
  type DiscoverScanAvailability,
} from "@/lib/discover-scan-limit";
import { formatNumber } from "@/lib/utils";
import type { CampaignDetail } from "@/types/database";

type CampaignDiscoverPanelProps = {
  campaign: CampaignDetail;
};

const textareaClassName =
  "min-h-[160px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 disabled:bg-slate-50 disabled:text-slate-500";

function toDateInputValue(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatPostedDate(value: string | null): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNextScanDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateCaption(value: string, max = 120): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed || "No caption";
  return `${trimmed.slice(0, max - 1)}…`;
}

export function CampaignDiscoverPanel({ campaign }: CampaignDiscoverPanelProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [creatorHandlesText, setCreatorHandlesText] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [dateFrom, setDateFrom] = useState(() =>
    toDateInputValue(campaign.start_date),
  );
  const [dateTo, setDateTo] = useState(() =>
    toDateInputValue(campaign.end_date),
  );
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [results, setResults] = useState<DiscoverCreatorResult[]>([]);
  const [selectedVideoUrls, setSelectedVideoUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [availability, setAvailability] = useState<DiscoverScanAvailability | null>(
    null,
  );
  const [nextScanAt, setNextScanAt] = useState<string | null>(null);

  const campaignCreatorHandles = useMemo(
    () => buildDiscoverCreatorHandlesText(campaign.creators),
    [campaign.creators],
  );

  async function refreshScanStatus() {
    const status = await getDiscoverScanStatus();
    if ("availability" in status) {
      setAvailability(status.availability);
      setNextScanAt(status.availability.nextScanAt);
    }
  }

  useEffect(() => {
    void refreshScanStatus();
  }, []);

  useEffect(() => {
    setDateFrom(toDateInputValue(campaign.start_date));
    setDateTo(toDateInputValue(campaign.end_date));
  }, [campaign.start_date, campaign.end_date]);

  useEffect(() => {
    setCreatorHandlesText((current) =>
      current.trim() ? current : campaignCreatorHandles,
    );
  }, [campaignCreatorHandles]);

  useEffect(() => {
    if (!isScanning) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isScanning]);

  useEffect(() => {
    if (!nextScanAt || availability?.canScan) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshScanStatus();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [nextScanAt, availability?.canScan]);

  const parsedCreators = useMemo(
    () => parseTikTokCreatorHandles(creatorHandlesText),
    [creatorHandlesText],
  );

  const parsedKeywords = useMemo(
    () => parseDiscoverKeywords(keywordsText),
    [keywordsText],
  );

  const totalMatches = useMemo(
    () => results.reduce((sum, result) => sum + result.matches.length, 0),
    [results],
  );

  const selectedCount = selectedVideoUrls.size;
  const loading = isScanning || isAdding;
  const canScan = availability?.canScan ?? true;
  const cooldownMessage =
    availability && !availability.canScan
      ? formatDiscoverScanCooldownMessage(availability.waitSeconds)
      : null;

  async function handleDiscoverScan(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResults([]);
    setSelectedVideoUrls(new Set());

    if (!canScan) {
      setError(cooldownMessage ?? "Keyword scan is limited to once per week.");
      return;
    }

    if (parsedCreators.valid.length === 0) {
      setError("Add at least one TikTok creator handle.");
      return;
    }

    if (parsedKeywords.length === 0) {
      setError("Add at least one keyword or hashtag.");
      return;
    }

    const estimated = estimateDiscoverScanSeconds(parsedCreators.valid.length);
    setEstimatedSeconds(estimated);
    setIsScanning(true);

    const scanResult = await scanCampaignCreatorsByKeywords({
      campaignId: campaign.id,
      creatorHandlesText,
      keywordsText,
      dateFrom,
      dateTo,
    });

    setIsScanning(false);
    setEstimatedSeconds(null);

    if (scanResult.error) {
      setError(scanResult.error);
      if (scanResult.nextScanAt) {
        setNextScanAt(scanResult.nextScanAt);
      }
      await refreshScanStatus();
      return;
    }

    const nextResults = scanResult.results ?? [];
    setResults(nextResults);

    if (scanResult.nextScanAt) {
      setNextScanAt(scanResult.nextScanAt);
    }
    await refreshScanStatus();

    const defaultSelected = new Set<string>();
    for (const result of nextResults) {
      for (const match of result.matches) {
        defaultSelected.add(match.videoUrl);
      }
    }
    setSelectedVideoUrls(defaultSelected);

    if (defaultSelected.size === 0) {
      showError("No matching videos found for these creators and keywords.");
    } else {
      showSuccess(
        `Found ${defaultSelected.size} matching video${defaultSelected.size === 1 ? "" : "s"}.`,
      );
    }
  }

  function toggleVideoSelection(videoUrl: string) {
    setSelectedVideoUrls((current) => {
      const next = new Set(current);
      if (next.has(videoUrl)) next.delete(videoUrl);
      else next.add(videoUrl);
      return next;
    });
  }

  function toggleCreatorMatches(result: DiscoverCreatorResult) {
    setSelectedVideoUrls((current) => {
      const next = new Set(current);
      const allSelected = result.matches.every((match) =>
        next.has(match.videoUrl),
      );
      for (const match of result.matches) {
        if (allSelected) next.delete(match.videoUrl);
        else next.add(match.videoUrl);
      }
      return next;
    });
  }

  async function handleAddSelected() {
    setError(null);

    if (selectedCount === 0) {
      setError("Select at least one matching video.");
      return;
    }

    setIsAdding(true);

    const addResult = await addDiscoveredVideosToCampaign({
      campaignId: campaign.id,
      videoUrls: [...selectedVideoUrls],
    });

    setIsAdding(false);

    if (addResult.error) {
      setError(addResult.error);
      return;
    }

    const added = addResult.added ?? 0;
    const failures = addResult.failures ?? [];

    if (added === 0) {
      setError(failures[0]?.error ?? "Could not add selected videos.");
      return;
    }

    showSuccess(
      `Added ${added} video${added === 1 ? "" : "s"}. Set fees on the Performance tab.`,
    );
    setResults([]);
    setSelectedVideoUrls(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-amber-300/70 bg-amber-50/50 px-4 py-3 text-sm text-amber-950">
        <span className="font-semibold">Shortcut mode.</span> Skip manual
        tracking — enter handles + keywords, scan TikTok, and add matching
        videos in one go. Use Content when you already have links.
      </div>

      <div className="rounded-xl border border-kefoo-200 bg-kefoo-50/80 px-4 py-3 text-sm text-kefoo-900">
        <p className="font-medium">{DISCOVER_WEEKLY_LIMIT_NOTICE}</p>
        {nextScanAt && !canScan ? (
          <p className="mt-1 text-kefoo-800">
            Next scan available on {formatNextScanDate(nextScanAt)} (
            {formatDiscoverScanWaitDuration(availability?.waitSeconds ?? 0)} left).
          </p>
        ) : nextScanAt && results.length > 0 ? (
          <p className="mt-1 text-kefoo-800">
            Next scan available on {formatNextScanDate(nextScanAt)}.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">Discover</h3>
        <p className="mt-1 text-sm text-slate-500">
          Find campaign videos by creator handle and keyword when you
          don&apos;t want to paste URLs one by one.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleDiscoverScan} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label="Add username" htmlFor="discover-creators">
              <textarea
                id="discover-creators"
                value={creatorHandlesText}
                onChange={(event) => setCreatorHandlesText(event.target.value)}
                placeholder={"@alya\n@bima\ntiktok.com/@rizky"}
                className={textareaClassName}
                disabled={loading || !canScan}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                @username or TikTok profile link. Up to {MAX_DISCOVER_CREATORS}{" "}
                creators.
                {campaignCreatorHandles
                  ? " Content tracker creators are prefilled when this field is empty."
                  : ""}
              </p>
            </FormField>

            <FormField label="Add keywords" htmlFor="discover-keywords">
              <textarea
                id="discover-keywords"
                value={keywordsText}
                onChange={(event) => setKeywordsText(event.target.value)}
                placeholder={"somethinc, serum, #SomethincPartner"}
                className="min-h-[160px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 disabled:bg-slate-50"
                disabled={loading || !canScan}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Brand, product, or hashtag. Best with 2 keywords or more (up to{" "}
                {MAX_DISCOVER_KEYWORDS}).
              </p>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="From" htmlFor="discover-from">
              <input
                id="discover-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className={inputClassName}
                disabled={loading || !canScan}
              />
            </FormField>
            <FormField label="To" htmlFor="discover-to">
              <input
                id="discover-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className={inputClassName}
                disabled={loading || !canScan}
              />
            </FormField>
          </div>

          {isScanning && estimatedSeconds !== null ? (
            <div className="rounded-xl border border-kefoo-200 bg-kefoo-50/80 px-4 py-3 text-sm text-kefoo-900">
              <div className="flex items-start gap-2">
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <div>
                  <p className="font-medium">
                    {formatDiscoverScanInProgressMessage(estimatedSeconds)}
                  </p>
                  <p className="mt-1 text-xs text-kefoo-800">
                    Elapsed: {elapsedSeconds}s
                    {elapsedSeconds > estimatedSeconds
                      ? " — still working, almost there"
                      : ` · ~${Math.max(0, estimatedSeconds - elapsedSeconds)}s remaining`}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!canScan && cooldownMessage ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{cooldownMessage}</p>
            </div>
          ) : null}

          {error ? <FormError message={error} /> : null}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            {results.length === 0 ? (
              <button
                type="submit"
                disabled={loading || !canScan}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-kefoo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-kefoo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {isScanning ? "Scanning…" : "Find matching videos"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={loading || selectedCount === 0}
                className="inline-flex items-center justify-center rounded-xl bg-kefoo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-kefoo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add {selectedCount} video{selectedCount === 1 ? "" : "s"} to
                campaign
              </button>
            )}
          </div>
        </form>

        {results.length > 0 ? (
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
            <p className="text-sm font-medium text-slate-900">
              {totalMatches} match{totalMatches === 1 ? "" : "es"} ·{" "}
              {selectedCount} selected
            </p>
            <div className="space-y-3">
              {results.map((result) => {
                const creatorSelected =
                  result.matches.length > 0 &&
                  result.matches.every((match) =>
                    selectedVideoUrls.has(match.videoUrl),
                  );

                return (
                  <article
                    key={result.username}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          @{result.username}
                          {result.displayName ? (
                            <span className="font-normal text-slate-500">
                              {" "}
                              · {result.displayName}
                            </span>
                          ) : null}
                        </p>
                        {result.error ? (
                          <p className="mt-1 text-xs text-red-600">
                            {result.error}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            {result.matches.length} matching video
                            {result.matches.length === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>
                      {result.matches.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleCreatorMatches(result)}
                          className="text-xs font-medium text-kefoo-600 hover:text-kefoo-500"
                        >
                          {creatorSelected ? "Clear" : "Select all"}
                        </button>
                      ) : null}
                    </div>

                    {result.matches.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {result.matches.map((match) => (
                          <li key={match.videoUrl}>
                            <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-kefoo-200">
                              <input
                                type="checkbox"
                                checked={selectedVideoUrls.has(match.videoUrl)}
                                onChange={() =>
                                  toggleVideoSelection(match.videoUrl)
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm text-slate-900">
                                  {truncateCaption(match.caption)}
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">
                                  {formatPostedDate(match.postedAt)} ·{" "}
                                  {formatNumber(match.views)} views
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
