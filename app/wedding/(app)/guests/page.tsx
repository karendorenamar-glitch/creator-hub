import { redirect } from "next/navigation";
import { GuestManager } from "@/components/wedding/guests/guest-manager";
import { SubscriptionNotice } from "@/components/wedding/subscription-notice";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { isSubscriptionActive, loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Guest List" };

export default async function GuestsPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const { data } = await supabase
    .from("guests")
    .select("*")
    .order("name", { ascending: true });

  const guests = data ?? [];
  const attending = guests.filter((g) => g.rsvp_status === "attending").length;
  const pending = guests.filter((g) => g.rsvp_status === "pending").length;
  const notAttending = guests.filter(
    (g) => g.rsvp_status === "not_attending",
  ).length;
  const invitationsSent = guests.filter(
    (g) => g.invitation_status === "sent",
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader title={copy.guests.title} subtitle={copy.guests.subtitle} />

      <SubscriptionNotice
        active={isSubscriptionActive(session.subscription)}
        copy={copy}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={copy.guests.invited} value={String(guests.length)} />
        <StatCard
          label={copy.guests.attending}
          value={String(attending)}
          tone="champagne"
        />
        <StatCard label={copy.guests.pending} value={String(pending)} />
        <StatCard
          label={copy.guests.notAttending}
          value={String(notAttending)}
          hint={`${copy.guests.sent}: ${invitationsSent}`}
        />
      </section>

      <Card>
        <GuestManager guests={guests} copy={copy} locale={locale} />
      </Card>
    </div>
  );
}
