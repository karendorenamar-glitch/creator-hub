import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteAcceptForm } from "@/components/wedding/settings/invite-accept-form";
import { Card } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { getCurrentUser } from "@/lib/wedding/session";

export const metadata = { title: "Partner invitation" };
export const dynamic = "force-dynamic";

export default async function AcceptWeddingInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/wedding/login?next=${encodeURIComponent(`/wedding/invite/${token}`)}`,
    );
  }

  const locale = await getLocale();
  const copy = weddingCopy[locale];

  return (
    <div className="wedding-app wedding-surface flex min-h-screen items-center justify-center px-4 py-10 text-cocoa sm:px-6">
      <Card className="w-full max-w-lg space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-petal-500">
            Kefoo Wedding Planner
          </p>
          <h1 className="mt-2 font-heading text-3xl text-cocoa">
            {copy.settings.inviteAcceptTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {copy.settings.inviteAcceptBody}
          </p>
        </div>

        <InviteAcceptForm token={token} copy={copy} />
        <Link
          href="/wedding/dashboard"
          className="block text-center text-xs font-medium text-ink-soft hover:underline"
        >
          {copy.settings.inviteAcceptLater}
        </Link>
      </Card>
    </div>
  );
}
