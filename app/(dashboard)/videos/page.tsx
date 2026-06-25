import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { TeamFilterSelect } from "@/components/layout/team-filter-select";
import { VideosSection } from "@/components/videos/videos-section";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getLeaderTeamFilterContext } from "@/app/actions/team";
import { getCampaignOptions, getCreators, getVideos } from "@/lib/data";
import {
  parseTeamFilterParam,
  resolveResourceScopeFilter,
  resolveTeamFilterForRole,
  shouldShowTeamFilter,
} from "@/lib/team-filter";
import { getOrgMembershipForAction } from "@/lib/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";

type VideosPageProps = {
  searchParams: Promise<{ team?: string }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { team } = await searchParams;
  const locale = await getLocale();
  const [teamContext, membership, planContext] = await Promise.all([
    getLeaderTeamFilterContext(),
    getOrgMembershipForAction(),
    getDashboardPlanContext(),
  ]);
  const memberIds = new Set(teamContext.members.map((member) => member.id));
  const parsedTeamFilter = parseTeamFilterParam(team, memberIds);
  const role = "error" in membership ? "team" : membership.role;
  const userId = "error" in membership ? "" : membership.userId;
  const leaderTeamFilter = resolveTeamFilterForRole(role, parsedTeamFilter);
  const scopeFilter = resolveResourceScopeFilter(role, userId, leaderTeamFilter);
  const showTeamFilter = shouldShowTeamFilter(
    teamContext.isLeader,
    planContext.plan,
  );

  const [videos, creators, campaigns] = await Promise.all([
    getVideos(scopeFilter),
    getCreators(undefined, scopeFilter),
    getCampaignOptions(),
  ]);

  return (
    <>
      <Header
        title={getMessage(locale, "pages.videos.title")}
        description={getMessage(locale, "pages.videos.descriptionShort")}
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {showTeamFilter ? (
          <Suspense
            fallback={
              <div className="h-11 w-56 animate-pulse rounded-lg bg-slate-200" />
            }
          >
            <TeamFilterSelect
              selectedTeam={leaderTeamFilter}
              teamMembers={teamContext.members}
              basePath="/videos"
              id="videos-team-filter"
            />
          </Suspense>
        ) : null}

        <VideosSection
          videos={videos}
          creators={creators.map(({ id, name, platform }) => ({
            id,
            name,
            platform,
          }))}
          campaigns={campaigns}
          currentUserId={userId}
          memberRole={role}
        />
      </main>
    </>
  );
}
