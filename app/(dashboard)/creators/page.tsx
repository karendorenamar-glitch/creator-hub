import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { TeamFilterSelect } from "@/components/layout/team-filter-select";
import { CreatorsSearch } from "@/components/creators/creators-search";
import { CreatorsSection } from "@/components/creators/creators-section";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getLeaderTeamFilterContext } from "@/app/actions/team";
import { getCampaignOptions, getCreators } from "@/lib/data";
import {
  parseTeamFilterParam,
  resolveResourceScopeFilter,
  resolveTeamFilterForRole,
  shouldShowTeamFilter,
} from "@/lib/team-filter";
import { getOrgMembershipForAction } from "@/lib/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";
import type { OrgMemberRole } from "@/types/database";

type CreatorsPageProps = {
  searchParams: Promise<{ q?: string; team?: string }>;
};

async function CreatorsContent({
  query,
  teamFilter,
  currentUserId,
  memberRole,
}: {
  query?: string;
  teamFilter: string;
  currentUserId: string;
  memberRole: OrgMemberRole;
}) {
  const [creators, campaigns] = await Promise.all([
    getCreators(query, teamFilter),
    getCampaignOptions(),
  ]);

  return (
    <CreatorsSection
      creators={creators}
      campaigns={campaigns}
      currentUserId={currentUserId}
      memberRole={memberRole}
    />
  );
}

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const { q, team } = await searchParams;
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

  return (
    <>
      <Header
        title={getMessage(locale, "pages.creators.title")}
        description={getMessage(locale, "pages.creators.descriptionShort")}
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end gap-4">
          <Suspense
            fallback={
              <div className="h-11 max-w-md animate-pulse rounded-lg bg-slate-200" />
            }
          >
            <CreatorsSearch />
          </Suspense>

          {showTeamFilter ? (
            <Suspense
              fallback={
                <div className="h-11 w-56 animate-pulse rounded-lg bg-slate-200" />
              }
            >
              <TeamFilterSelect
                selectedTeam={leaderTeamFilter}
                teamMembers={teamContext.members}
                basePath="/creators"
                id="creators-team-filter"
              />
            </Suspense>
          ) : null}
        </div>

        <CreatorsContent
          query={q}
          teamFilter={scopeFilter}
          currentUserId={userId}
          memberRole={role}
        />
      </main>
    </>
  );
}
