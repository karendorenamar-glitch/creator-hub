import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  formatCreatorCPL,
  formatCreatorCPV,
  formatEngagementRate,
  formatIDR,
  formatNumber,
} from "@/lib/utils";
import type { CreatorDetail } from "@/types/database";
import {
  BarChart3,
  DollarSign,
  Heart,
  Megaphone,
  MessageCircle,
  Share2,
  TrendingUp,
  Video,
  Eye,
  Bookmark,
} from "lucide-react";

type CreatorDetailSectionProps = {
  creator: CreatorDetail;
};

function CreatorAvatar({ creator }: { creator: CreatorDetail }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
      {creator.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function CreatorDetailSection({ creator }: CreatorDetailSectionProps) {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/creators"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to creators
        </Link>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <CreatorAvatar creator={creator} />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{creator.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{creator.platform}</p>
          {creator.contact && (
            <p className="mt-1 text-sm text-slate-600">{creator.contact}</p>
          )}
          <p className="mt-2 text-sm text-slate-600">
            {formatNumber(creator.followers)} followers · Fee{" "}
            {formatIDR(creator.fee)}
          </p>
        </div>
      </div>

      {creator.notes && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
            {creator.notes}
          </p>
        </section>
      )}

      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Fee & Cost Metrics
        </h3>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Creator Fee"
            value={formatIDR(creator.fee)}
            icon={DollarSign}
            accent="indigo"
          />
          <StatCard
            title="Cost Per View"
            value={formatCreatorCPV(creator.fee, creator.total_views)}
            subtitle="Fee divided by total views"
            icon={Eye}
            accent="violet"
          />
          <StatCard
            title="Cost Per Like"
            value={formatCreatorCPL(creator.fee, creator.total_likes)}
            subtitle="Fee divided by total likes"
            icon={Heart}
            accent="emerald"
          />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Creator Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Videos"
            value={formatNumber(creator.total_videos)}
            icon={Video}
            accent="indigo"
          />
          <StatCard
            title="Total Views"
            value={formatNumber(creator.total_views)}
            icon={Eye}
            accent="violet"
          />
          <StatCard
            title="Total Likes"
            value={formatNumber(creator.total_likes)}
            icon={Heart}
            accent="emerald"
          />
          <StatCard
            title="Total Comments"
            value={formatNumber(creator.total_comments)}
            icon={MessageCircle}
            accent="amber"
          />
          <StatCard
            title="Total Shares"
            value={formatNumber(creator.total_shares)}
            icon={Share2}
            accent="indigo"
          />
          <StatCard
            title="Total Saves"
            value={formatNumber(creator.total_saves)}
            icon={Bookmark}
            accent="emerald"
          />
          <StatCard
            title="Engagement Rate"
            value={formatEngagementRate(creator.average_engagement_rate)}
            subtitle="(likes + comments + shares + saves) / views"
            icon={TrendingUp}
            accent="violet"
          />
          <StatCard
            title="Campaigns Joined"
            value={formatNumber(creator.campaigns.length)}
            icon={Megaphone}
            accent="emerald"
          />
          <StatCard
            title="Top Performing Video"
            value={
              creator.top_performing_video
                ? formatNumber(creator.top_performing_video.views)
                : "—"
            }
            subtitle={
              creator.top_performing_video
                ? `${creator.top_performing_video.video_url.slice(0, 48)}${creator.top_performing_video.video_url.length > 48 ? "…" : ""}`
                : "No videos yet"
            }
            icon={BarChart3}
            accent="amber"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Campaigns</h3>
          {creator.campaigns.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              This creator has not joined any campaigns yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {creator.campaigns.map((campaign) => (
                <li key={campaign.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {campaign.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {campaign.brand_name}
                      </p>
                    </div>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Videos</h3>
          {creator.videos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No videos linked to this creator yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {creator.videos.map((video) => (
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
                    <span>{formatNumber(video.views)} views</span>
                    <span>{formatNumber(video.likes)} likes</span>
                    <span>{formatNumber(video.comments)} comments</span>
                    <span>{formatNumber(video.shares)} shares</span>
                    <span>{formatNumber(video.saves)} saves</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
