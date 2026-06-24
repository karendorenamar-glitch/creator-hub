import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/org";
import { AcceptTeamInviteButton } from "@/components/settings/accept-team-invite-button";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const user = await getAuthUser();

  if (!user) {
    redirect(
      `/login?signup=1&next=${encodeURIComponent(`/invite/${token}`)}`,
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Join workspace
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          You were invited to join a Kefoo workspace. Accept the invite to access
          the team dashboard and campaigns.
        </p>

        <AcceptTeamInviteButton token={token} />

        <p className="mt-5 text-center text-sm text-slate-500">
          Signed in as {user.email ?? "your account"}.
        </p>
      </div>
    </div>
  );
}
