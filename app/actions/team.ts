"use server";

import { revalidatePath } from "next/cache";
import {
  getActiveOrganization,
  getAuthUser,
  getOrgMembershipForAction,
  setActiveOrgCookie,
} from "@/lib/org";
import {
  formatOrgMemberRoleLabel,
  isLeaderRole,
  normalizeOrgMemberRole,
} from "@/lib/org-team";
import {
  planAllowsTeamInvitesWithAddOns,
  resolveEffectiveLimits,
} from "@/lib/plan-add-ons";
import { getOrgAddOns } from "@/lib/plan-enforcement";
import { getUserGreetingName } from "@/lib/user-display";
import { createClient } from "@/lib/supabase/server";
import { purgeOrphanedAuthUser } from "@/lib/supabase/admin";
import type { OrgInvite, OrgMemberRole, OrgPlan } from "@/types/database";

export type TeamMemberRow = {
  userId: string;
  email: string;
  fullName: string;
  role: OrgMemberRole;
  joinedAt: string;
};

export type TeamInviteRow = {
  id: string;
  email: string;
  role: OrgMemberRole;
  token: string;
  expiresAt: string;
  createdAt: string;
};

export type TeamWorkspaceContext = {
  plan: OrgPlan;
  memberLimit: number;
  seatUsage: number;
  canInvite: boolean;
  isLeader: boolean;
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
};

function mapInvite(invite: OrgInvite): TeamInviteRow {
  return {
    id: invite.id,
    email: invite.email,
    role: normalizeOrgMemberRole(invite.role),
    token: invite.token,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
  };
}

export async function getTeamWorkspaceContext(): Promise<
  { data: TeamWorkspaceContext } | { error: string }
> {
  const membership = await getOrgMembershipForAction();
  if ("error" in membership) {
    return { error: membership.error };
  }

  const organization = await getActiveOrganization();
  if (!organization) {
    return { error: "No active organization." };
  }

  const supabase = await createClient();
  const isLeader = membership.role === "leader";

  const membersResult = await supabase.rpc("get_org_team_members", {
    p_org_id: membership.orgId,
  });

  if (membersResult.error) {
    if (
      membersResult.error.message.toLowerCase().includes("get_org_team_members")
    ) {
      return {
        error:
          "Team features are not set up yet. Run supabase/org-team.sql in Supabase.",
      };
    }

    return { error: membersResult.error.message };
  }

  const members: TeamMemberRow[] = (membersResult.data ?? []).map(
    (row: {
      user_id: string;
      email: string;
      full_name: string;
      role: string;
      joined_at: string;
    }) => ({
      userId: row.user_id,
      email: row.email,
      fullName: row.full_name,
      role: normalizeOrgMemberRole(row.role),
      joinedAt: row.joined_at,
    }),
  );

  let invites: TeamInviteRow[] = [];

  if (isLeader) {
    const { data: inviteRows, error: inviteError } = await supabase
      .from("org_invites")
      .select("*")
      .eq("org_id", membership.orgId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (inviteError) {
      return { error: inviteError.message };
    }

    invites = (inviteRows as OrgInvite[]).map(mapInvite);
  }

  const addOns = await getOrgAddOns(membership.orgId);
  const memberLimit = resolveEffectiveLimits(
    organization.plan,
    organization.member_limit,
    addOns,
  ).members;
  const seatUsage = members.length + invites.length;

  return {
    data: {
      plan: organization.plan,
      memberLimit,
      seatUsage,
      canInvite:
        isLeader && planAllowsTeamInvitesWithAddOns(organization.plan, addOns),
      isLeader,
      members,
      invites,
    },
  };
}

export async function inviteTeamMember(input: {
  email: string;
  role: OrgMemberRole;
}) {
  const membership = await getOrgMembershipForAction();
  if ("error" in membership) {
    return { error: membership.error };
  }

  if (membership.role !== "leader") {
    return { error: "Only leaders can invite team members." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_org_member", {
    p_org_id: membership.orgId,
    p_email: input.email.trim(),
    p_role: input.role,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");

  const row = Array.isArray(data) ? data[0] : data;

  if (row?.added_directly) {
    return {
      success: true,
      message: `${input.email.trim()} was added to your workspace as ${formatOrgMemberRoleLabel(input.role)}.`,
    };
  }

  const inviteToken = row?.invite_token as string | undefined;

  return {
    success: true,
    message: `Invite sent to ${input.email.trim()}.`,
    inviteToken,
  };
}

function isMissingRpcError(message: string, rpcName: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes(rpcName.toLowerCase()) ||
    lower.includes("could not find the function") ||
    lower.includes("schema cache")
  );
}

async function removeTeamMemberFallback(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  orgId: string;
  userId: string;
  currentUserId: string;
}) {
  const { supabase, orgId, userId, currentUserId } = params;

  if (userId === currentUserId) {
    return { error: "You cannot remove yourself." };
  }

  const { data: members, error: membersError } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId);

  if (membersError) {
    return { error: membersError.message };
  }

  const leaderRows = (members ?? []).filter((row) => isLeaderRole(row.role));
  const targetIsLeader = leaderRows.some((row) => row.user_id === userId);

  if (targetIsLeader && leaderRows.length <= 1) {
    return { error: "You cannot remove the last leader." };
  }

  const { data: removedRows, error: deleteError } = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .select("user_id");

  if (deleteError) {
    return {
      error:
        "Team removal is not set up yet. Run supabase/fix-remove-org-member.sql in Supabase.",
    };
  }

  if (!removedRows?.length) {
    return { error: "Team member not found in this workspace." };
  }

  await purgeOrphanedAuthUser(userId);

  return { success: true as const };
}

export async function removeTeamMember(userId: string) {
  const membership = await getOrgMembershipForAction();
  if ("error" in membership) {
    return { error: membership.error };
  }

  if (membership.role !== "leader") {
    return { error: "Only leaders can remove team members." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_org_member", {
    p_org_id: membership.orgId,
    p_user_id: userId,
  });

  if (error) {
    if (isMissingRpcError(error.message, "remove_org_member")) {
      const fallback = await removeTeamMemberFallback({
        supabase,
        orgId: membership.orgId,
        userId,
        currentUserId: membership.userId,
      });

      if ("error" in fallback) {
        return fallback;
      }
    } else {
      return { error: error.message };
    }
  }

  await purgeOrphanedAuthUser(userId);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/creators");
  revalidatePath("/videos");
  revalidatePath("/campaigns");
  return { success: true };
}

export async function cancelTeamInvite(inviteId: string) {
  const membership = await getOrgMembershipForAction();
  if ("error" in membership) {
    return { error: membership.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_org_invite", {
    p_invite_id: inviteId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function acceptTeamInvite(token: string) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "You must be signed in to accept this invite." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_org_invite", {
    p_token: token.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  const orgId = data as string;
  await setActiveOrgCookie(orgId);
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true, orgId };
}

export async function getLeaderTeamFilterContext(): Promise<{
  isLeader: boolean;
  members: { id: string; label: string }[];
}> {
  const membership = await getOrgMembershipForAction();

  if ("error" in membership || membership.role !== "leader") {
    return { isLeader: false, members: [] };
  }

  const context = await getTeamWorkspaceContext();

  if ("error" in context) {
    const user = await getAuthUser();

    return {
      isLeader: true,
      members: user
        ? [
            {
              id: user.id,
              label: getUserGreetingName(user.user_metadata, user.email),
            },
          ]
        : [],
    };
  }

  return {
    isLeader: true,
    members: context.data.members.map((member) => ({
      id: member.userId,
      label: member.fullName.trim() || member.email,
    })),
  };
}

export async function getDashboardTeamMemberOptions(): Promise<
  { id: string; label: string }[]
> {
  const context = await getTeamWorkspaceContext();
  if ("error" in context) {
    return [];
  }

  return context.data.members.map((member) => ({
    id: member.userId,
    label: member.fullName.trim() || member.email,
  }));
}
