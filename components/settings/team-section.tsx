"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, X } from "lucide-react";
import {
  cancelTeamInvite,
  inviteTeamMember,
  removeTeamMember,
  type TeamWorkspaceContext,
} from "@/app/actions/team";
import { useToast } from "@/components/ui/toast";
import { usePlan } from "@/components/plan/plan-provider";
import { formatOrgMemberRoleLabel } from "@/lib/org-team";
import type { OrgMemberRole } from "@/types/database";

type TeamSectionProps = {
  initialContext: TeamWorkspaceContext;
  currentUserId: string;
};

export function TeamSection({ initialContext, currentUserId }: TeamSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { openUpgradeModal } = usePlan();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgMemberRole>("team");
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const seatsLeft = Math.max(initialContext.memberLimit - initialContext.seatUsage, 0);
  const inviteBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const sortedMembers = useMemo(
    () =>
      [...initialContext.members].sort((a, b) => {
        if (a.role === b.role) {
          return a.fullName.localeCompare(b.fullName);
        }

        return a.role === "leader" ? -1 : 1;
      }),
    [initialContext.members],
  );

  function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startSubmitTransition(async () => {
      const result = await inviteTeamMember({ email, role });

      if ("error" in result && result.error) {
        showError(result.error);
        return;
      }

      showSuccess(result.message ?? "Invite sent.");
      setEmail("");
      setRole("team");
      router.refresh();
    });
  }

  function handleRemoveMember(userId: string) {
    setPendingAction(userId);

    startSubmitTransition(async () => {
      const result = await removeTeamMember(userId);

      if ("error" in result && result.error) {
        showError(result.error);
        setPendingAction(null);
        return;
      }

      showSuccess("Team member removed.");
      router.refresh();
      setPendingAction(null);
    });
  }

  function handleCancelInvite(inviteId: string) {
    setPendingAction(inviteId);

    startSubmitTransition(async () => {
      const result = await cancelTeamInvite(inviteId);

      if ("error" in result && result.error) {
        showError(result.error);
        setPendingAction(null);
        return;
      }

      showSuccess("Invite cancelled.");
      router.refresh();
      setPendingAction(null);
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Team</h2>
          <p className="mt-1 text-sm text-slate-600">
            {initialContext.canInvite
              ? "Invite teammates to your workspace. Leaders see the full team; Team members can view performance but only edit their own campaigns."
              : initialContext.plan === "free_trial"
                ? "This plan is for 1 user only. Upgrade to invite teammates and unlock more features."
                : "Team invites are available on the Scale plan (3 users)."}
          </p>
        </div>
        <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          {initialContext.seatUsage}/{initialContext.memberLimit} seats used
        </p>
      </div>

      {!initialContext.canInvite ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() =>
              openUpgradeModal(
                initialContext.plan === "free_trial"
                  ? "Upgrade to Starter or Scale to invite teammates and unlock more features."
                  : "Team invites are available on the Scale plan (3 users).",
                initialContext.plan === "free_trial"
                  ? "/checkout/starter"
                  : "/checkout/scale",
              )
            }
            className="inline-flex rounded-2xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300"
          >
            Upgrade plan
          </button>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {sortedMembers.map((member) => (
          <div
            key={member.userId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="font-medium text-slate-900">
                {member.fullName.trim() || member.email}
              </p>
              <p className="text-sm text-slate-500">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                {formatOrgMemberRoleLabel(member.role)}
              </span>
              {initialContext.isLeader && member.userId !== currentUserId ? (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={Boolean(pendingAction)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {initialContext.isLeader && initialContext.invites.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium text-slate-700">Pending invites</p>
          {initialContext.invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-amber-950">{invite.email}</p>
                  <p className="text-sm text-amber-900">
                    {formatOrgMemberRoleLabel(invite.role)} · expires{" "}
                    {new Date(invite.expiresAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelInvite(invite.id)}
                  disabled={pendingAction === invite.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
              <p className="mt-3 break-all rounded-lg bg-white/80 px-3 py-2 text-xs text-amber-950">
                {inviteBaseUrl}/invite/{invite.token}
              </p>
              <p className="mt-2 text-xs text-amber-800">
                Teammates without a Kefoo account should open this link and create
                an account with <span className="font-medium">{invite.email}</span>.
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {initialContext.canInvite ? (
        <form
          className="mt-6 space-y-4 border-t border-slate-100 pt-5"
          onSubmit={handleInvite}
        >
          <p className="text-sm font-medium text-slate-700">
            Invite a teammate ({seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left)
          </p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              required
              disabled={isSubmitting || seatsLeft === 0}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
            />
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as OrgMemberRole)
              }
              disabled={isSubmitting || seatsLeft === 0}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
            >
              <option value="team">Team</option>
              <option value="leader">Leader</option>
            </select>
            <button
              type="submit"
              disabled={isSubmitting || seatsLeft === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Invite
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
