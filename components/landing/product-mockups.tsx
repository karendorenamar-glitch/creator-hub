import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductMockupFrameProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function ProductMockupFrame({
  title,
  children,
  className,
}: ProductMockupFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="mx-auto truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200">
          kefoo.tech/{title}
        </div>
      </div>
      <div className="bg-slate-50">{children}</div>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <ProductMockupFrame title="dashboard">
      <div className="p-4 sm:p-6">
        <div className="mb-4 border-b border-slate-200 pb-4">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Campaign Reporting
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Performance across active campaigns
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Campaigns", value: "12", accent: "text-kefoo-600 bg-kefoo-50" },
            { label: "Total Budget", value: "$248K", accent: "text-kefoo-600 bg-kefoo-50" },
            { label: "Total Views", value: "4.2M", accent: "text-emerald-600 bg-emerald-50" },
            { label: "Average ER", value: "6.8%", accent: "text-amber-600 bg-amber-50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {stat.value}
              </p>
              <div
                className={`mt-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.accent}`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-60" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Views trend
            </p>
            <div className="mt-4 flex h-28 items-end gap-2">
              {[38, 52, 44, 68, 58, 74, 62, 88, 72, 96].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-kefoo-500 to-kefoo-400 opacity-90"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Top Creator
            </p>
            <p className="mt-3 text-base font-semibold text-slate-900">Alex Rivera</p>
            <p className="text-xs text-slate-500">TikTok · 1.2M views</p>
          </div>
        </div>
      </div>
    </ProductMockupFrame>
  );
}

export function PlannerMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <ProductMockupFrame title="planner">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">Content Planner</p>
            <p className="text-xs text-slate-500">June 2026 · Calendar view</p>
          </div>
          <span className="rounded-full bg-kefoo-50 px-2.5 py-1 text-[10px] font-medium text-kefoo-700">
            24 scheduled
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-600">
          {days.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, index) => {
            const hasEvent = [2, 5, 8, 11, 14, 17, 20].includes(index);
            const statuses = [
              "bg-kefoo-100 text-kefoo-700 border-kefoo-200",
              "bg-kefoo-100 text-kefoo-700 border-kefoo-200",
              "bg-emerald-100 text-emerald-700 border-emerald-200",
            ];

            return (
              <div
                key={index}
                className="min-h-14 rounded-lg border border-slate-200 bg-white p-1"
              >
                <span className="text-[10px] text-slate-600">{index + 1}</span>
                {hasEvent && (
                  <div
                    className={`mt-1 truncate rounded border px-1 py-0.5 text-[8px] font-medium ${statuses[index % statuses.length]}`}
                  >
                    Idea
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ProductMockupFrame>
  );
}

export function CreatorsMockup() {
  return (
    <ProductMockupFrame title="creators">
      <div className="p-4 sm:p-5">
        <p className="text-base font-semibold text-slate-900">Creators</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            <span className="col-span-2">Creator</span>
            <span>Platform</span>
            <span className="text-right">Followers</span>
          </div>
          {[
            ["Jordan Lee", "TikTok", "890K"],
            ["Sam Chen", "Instagram", "450K"],
            ["Alex Rivera", "Instagram", "1.2M"],
          ].map(([name, platform, followers]) => (
            <div
              key={name}
              className="grid grid-cols-4 items-center border-b border-slate-100 px-3 py-3 text-xs last:border-0"
            >
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-kefoo-100 text-[10px] font-semibold text-kefoo-700">
                  {name?.[0]}
                </div>
                <span className="font-medium text-slate-900">{name}</span>
              </div>
              <span className="text-slate-600">{platform}</span>
              <span className="text-right font-medium text-slate-900">
                {followers}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ProductMockupFrame>
  );
}

export function CampaignsMockup() {
  return (
    <ProductMockupFrame title="campaigns">
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {[
          { name: "Summer Launch", client: "Acme Co.", budget: 42_000_000, status: "Active" },
          { name: "Holiday Push", client: "Nova Brand", budget: 86_000_000, status: "Active" },
        ].map((campaign) => (
          <div
            key={campaign.name}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-kefoo-600">{campaign.name}</p>
                <p className="text-xs text-slate-500">{campaign.client}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                {campaign.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-500">Budget</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatMoney(campaign.budget)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Creators</p>
                <p className="text-sm font-semibold text-slate-900">8</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Videos</p>
                <p className="text-sm font-semibold text-slate-900">14</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ProductMockupFrame>
  );
}