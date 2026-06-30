"use client";

import Link from "next/link";
import { ArrowRight, Library } from "lucide-react";
import { VideosTable } from "@/components/videos/videos-table";
import { FreeTrialUsageBanner } from "@/components/plan/plan-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import type { OrgMemberRole, VideoWithCreator } from "@/types/database";

type VideosSectionProps = {
  videos: VideoWithCreator[];
  currentUserId: string;
  memberRole: OrgMemberRole;
};

export function VideosSection({
  videos,
  currentUserId,
  memberRole,
}: VideosSectionProps) {
  const { t } = useLanguage();

  return (
    <>
      <FreeTrialUsageBanner />

      <div className="mb-6 flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
        <Library className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <p>
          {t("pages.videos.libraryHint")}{" "}
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 font-medium text-kefoo-600 hover:text-kefoo-500"
          >
            {t("pages.videos.libraryHintLink")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>

      <VideosTable
        videos={videos}
        currentUserId={currentUserId}
        memberRole={memberRole}
        readOnly
      />
    </>
  );
}
