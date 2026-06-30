"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { unlinkVideoFromCampaign } from "@/app/actions/campaigns";
import { createVideoFromUrl, revalidateAfterBulkUpload } from "@/app/actions/videos";
import { useLanguage } from "@/components/i18n/language-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError, FormField, inputClassName } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableElement,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/ui/data-table";
import { runWithConcurrency } from "@/lib/async-pool";
import {
  parseVideoUrlsForPlatform,
  type VideoPlatform,
} from "@/lib/video-url";
import { formatNumber } from "@/lib/utils";
import type { CampaignDetail, VideoWithCreator } from "@/types/database";

type CampaignVideosPanelProps = {
  campaign: CampaignDetail;
  embedded?: boolean;
  canEdit?: boolean;
};

const MAX_PASTE_VIDEOS = 100;
const PASTE_CONCURRENCY = 5;

const textareaClassName =
  "min-h-[160px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 disabled:bg-slate-50 disabled:text-slate-500";

export function CampaignVideosPanel({
  campaign,
  embedded = false,
  canEdit = true,
}: CampaignVideosPanelProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [platform, setPlatform] = useState<VideoPlatform>("TikTok");
  const [linksText, setLinksText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteProgress, setPasteProgress] = useState({ current: 0, total: 0 });
  const [removeTarget, setRemoveTarget] = useState<VideoWithCreator | null>(null);
  const [isRemovingVideo, startRemoveVideoTransition] = useTransition();

  const parsedLinks = useMemo(
    () => parseVideoUrlsForPlatform(linksText, platform),
    [linksText, platform],
  );

  async function handlePasteSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (parsedLinks.valid.length === 0) {
      setError(`Add at least one valid ${platform} video link.`);
      return;
    }

    if (parsedLinks.valid.length > MAX_PASTE_VIDEOS) {
      setError(
        `Remove ${parsedLinks.valid.length - MAX_PASTE_VIDEOS} links to stay within the ${MAX_PASTE_VIDEOS}-video limit.`,
      );
      return;
    }

    setIsPasting(true);
    setPasteProgress({ current: 0, total: parsedLinks.valid.length });

    let added = 0;
    let createdCreators = 0;
    const failures: string[] = [];

    await runWithConcurrency(
      parsedLinks.valid,
      PASTE_CONCURRENCY,
      async (videoUrl) => {
        const result = await createVideoFromUrl({
          video_url: videoUrl,
          platform,
          campaign_id: campaign.id,
          import_metrics: true,
          auto_create_creator: true,
          revalidate: false,
        });

        if (result.error) {
          failures.push(result.error);
          return;
        }

        added += 1;
        if ("createdCreator" in result && result.createdCreator) {
          createdCreators += 1;
        }
      },
      (current, total) => setPasteProgress({ current, total }),
    );

    revalidateAfterBulkUpload(campaign.id);
    setIsPasting(false);

    if (added === 0) {
      setError(failures[0] ?? "Could not add videos to this campaign.");
      return;
    }

    const message =
      createdCreators > 0
        ? `Added ${added} video${added === 1 ? "" : "s"} and created ${createdCreators} creator${createdCreators === 1 ? "" : "s"}.`
        : `Added ${added} video${added === 1 ? "" : "s"} to ${campaign.name}.`;

    showSuccess(message);
    setLinksText("");
    router.refresh();
  }

  function handleRemoveVideo() {
    if (!removeTarget) return;

    startRemoveVideoTransition(async () => {
      const result = await unlinkVideoFromCampaign(campaign.id, removeTarget.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Video was removed from this campaign.");
      setRemoveTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {embedded ? (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t("campaign.content.pasteTitle")}
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            {t("campaign.content.pasteDescription")}
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Videos</h3>
          <p className="mt-1 text-sm text-slate-500">
            Already have links? Paste TikTok or Instagram URLs in bulk — metrics
            import automatically.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <FormField label="Platform" htmlFor="videos-paste-platform">
            <select
              id="videos-paste-platform"
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value as VideoPlatform)
              }
              className={inputClassName}
              disabled={isPasting}
            >
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
            </select>
          </FormField>

          <FormField label="Video links" htmlFor="videos-paste-links">
            <textarea
              id="videos-paste-links"
              value={linksText}
              onChange={(event) => setLinksText(event.target.value)}
              placeholder={
                platform === "TikTok"
                  ? "https://www.tiktok.com/@creator/video/1234567890"
                  : "https://www.instagram.com/reel/ABC123/"
              }
              className={textareaClassName}
              disabled={isPasting}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              One link per line. Up to {MAX_PASTE_VIDEOS} links.
            </p>
          </FormField>

          {parsedLinks.valid.length > 0 ? (
            <p className="text-sm text-slate-600">
              {parsedLinks.valid.length} valid link
              {parsedLinks.valid.length === 1 ? "" : "s"} ready to import.
            </p>
          ) : null}

          {isPasting ? (
            <p className="text-sm text-slate-600">
              Importing {pasteProgress.current}/{pasteProgress.total} videos…
            </p>
          ) : null}

          {error ? <FormError message={error} /> : null}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isPasting || parsedLinks.valid.length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-kefoo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-kefoo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPasting ? "Importing…" : "Import videos"}
            </button>
          </div>
        </form>
      </section>

      {campaign.videos.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Linked videos
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Videos currently attached to this campaign.
            </p>
          </div>

          <DataTable>
            <DataTableElement>
              <DataTableHead>
                <DataTableHeaderCell>Video</DataTableHeaderCell>
                <DataTableHeaderCell>Creator</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Views</DataTableHeaderCell>
                {canEdit ? (
                  <DataTableHeaderCell className="text-right">Remove</DataTableHeaderCell>
                ) : null}
              </DataTableHead>
              <DataTableBody>
                {campaign.videos.map((video) => (
                  <DataTableRow key={video.id}>
                    <DataTableCell className="max-w-xs">
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate font-medium text-kefoo-600 hover:text-kefoo-500"
                      >
                        {video.video_url}
                      </a>
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {video.creators?.name ?? "Unknown"}
                    </DataTableCell>
                    <DataTableCell className="text-right text-slate-600">
                      {formatNumber(video.views)}
                    </DataTableCell>
                    {canEdit ? (
                      <DataTableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(video)}
                          className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove video from campaign"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </DataTableCell>
                    ) : null}
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTableElement>
          </DataTable>
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove video from campaign?"
        description="This unlinks the video from this campaign. The video stays in your library."
        loading={isRemovingVideo}
        onConfirm={handleRemoveVideo}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
