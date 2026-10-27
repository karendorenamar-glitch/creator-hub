import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/wedding/ui";
import { InvitePartnerPanel } from "@/components/wedding/settings/invite-partner-panel";
import { WeddingDetailsForm } from "@/components/wedding/wedding-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Wedding Settings" };

export default async function WeddingSettingsPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");

  const copy = weddingCopy[locale];
  const wedding = session.wedding;
  const supabase = await createWeddingClient();
  const [{ data: memberRows }, { data: pendingRows }] = await Promise.all([
    supabase
      .from("wedding_members")
      .select("user_id, role")
      .eq("wedding_id", wedding.id),
    supabase
      .from("wedding_invites")
      .select("*")
      .eq("wedding_id", wedding.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const hasPartner = Boolean(
    (memberRows ?? []).some((member) => member.role === "partner"),
  );
  const pendingInvite = pendingRows?.[0] ?? null;

  return (
    <div className="space-y-7">
      <PageHeader title={copy.settings.title} subtitle={copy.settings.subtitle} />

      <Card className="max-w-3xl">
        <WeddingDetailsForm
          copy={copy}
          mode="update"
          values={{
            partnerOne: wedding.partner_one_name,
            partnerTwo: wedding.partner_two_name ?? "",
            weddingDate: wedding.wedding_date ?? "",
            location: wedding.location ?? "",
            estimatedGuests:
              wedding.estimated_guest_count === null
                ? ""
                : String(wedding.estimated_guest_count),
            totalBudget: String(wedding.total_budget),
            notes: wedding.notes ?? "",
          }}
        />
      </Card>

      <Card className="max-w-3xl">
        <InvitePartnerPanel
          canInvite={session.role === "owner"}
          hasPartner={hasPartner}
          pendingInvite={pendingInvite}
          copy={copy}
          locale={locale}
        />
      </Card>
    </div>
  );
}
