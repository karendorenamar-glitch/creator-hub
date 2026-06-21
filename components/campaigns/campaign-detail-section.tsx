"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { deleteCampaign } from "@/app/actions/campaigns";
import { CampaignAnalyticsGrid } from "@/components/campaigns/campaign-analytics";
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type {
  CampaignDetail,
  Creator,
  VideoWithCreator,
} from "@/types/database";

type CampaignDetailSectionProps = {
  campaign: CampaignDetail;
  creators: Creator[];
  videos: VideoWithCreator[];
};

export function CampaignDetailSection({
  campaign,
  creators,
  videos,
}: CampaignDetailSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCampaign(campaign.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(`"${campaign.name}" was deleted.`);
      router.push("/campaigns");
    });
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to campaigns
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {campaign.name}
            </h2>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{campaign.brand_name}</p>
          <p className="mt-2 text-sm text-slate-600">
            {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Campaign Analytics
            </h3>
            <p className="text-sm text-slate-500">
              Calculated from {campaign.videos.length} linked video
              {campaign.videos.length === 1 ? "" : "s"} and{" "}
              {campaign.creators.length} linked creator
              {campaign.creators.length === 1 ? "" : "s"}.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            Budget {formatCurrency(campaign.budget)}
          </p>
        </div>
        <CampaignAnalyticsGrid analytics={campaign} budget={campaign.budget} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Creators</h3>
          {campaign.creators.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No creators linked to this campaign.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {campaign.creators.map((creator) => (
                <li
                  key={creator.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{creator.name}</p>
                    <p className="text-sm text-slate-500">{creator.platform}</p>
                  </div>
                  <span className="text-sm text-slate-600">
                    {formatNumber(creator.followers)} followers
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Videos</h3>
          {campaign.videos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No videos linked to this campaign.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {campaign.videos.map((video) => (
                <li key={video.id} className="py-3 first:pt-0 last:pb-0">
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {video.video_url}
                  </a>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{video.creators?.name ?? "Unknown"}</span>
                    <span>{video.views.toLocaleString()} views</span>
                    <span>{video.likes.toLocaleString()} likes</span>
                    <span>{video.comments.toLocaleString()} comments</span>
                    <span>{video.shares.toLocaleString()} shares</span>
                    <span>{video.saves.toLocaleString()} saves</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CampaignFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        campaign={campaign}
        creators={creators}
        videos={videos}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete campaign?"
        description={`This will permanently remove "${campaign.name}" and unlink all associated creators and videos.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
