import Link from "next/link";
import { redirect } from "next/navigation";
import { GuestManager } from "@/components/wedding/guests/guest-manager";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { summarizeGuestSides, totalGuestPeople } from "@/lib/wedding/guest-count";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Guest List" };

export default async function GuestsPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const { data, error: guestsError } = await supabase
    .from("guests")
    .select("*")
    .order("name", { ascending: true });

  const guests = data ?? [];
  const sideSummary = summarizeGuestSides(guests);
  const invited = totalGuestPeople(guests);
  const target = Number(session.wedding.estimated_guest_count ?? 0);
  const hasTarget = Number.isFinite(target) && target > 0;
  const remaining = hasTarget ? target - invited : null;
  const overTarget = remaining !== null && remaining < 0;
  const targetProgress = hasTarget
    ? Math.min(100, Math.round((invited / target) * 100))
    : 0;
  const attending = totalGuestPeople(
    guests.filter((g) => g.rsvp_status === "attending"),
  );
  const pending = totalGuestPeople(
    guests.filter((g) => g.rsvp_status === "pending"),
  );
  const notAttending = totalGuestPeople(
    guests.filter((g) => g.rsvp_status === "not_attending"),
  );
  const invitationsSent = guests.filter(
    (g) => g.invitation_status === "sent",
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader title={copy.guests.title} subtitle={copy.guests.subtitle} />

      {guestsError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <p className="text-sm text-rose-800">{copy.errors.generic}</p>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={copy.guests.brideGuests}
          value={String(sideSummary.bride.people)}
          hint={copy.guests.invitationRecords.replace(
            "{count}",
            String(sideSummary.bride.records),
          )}
          tone="blush"
        />
        <StatCard
          label={copy.guests.groomGuests}
          value={String(sideSummary.groom.people)}
          hint={copy.guests.invitationRecords.replace(
            "{count}",
            String(sideSummary.groom.records),
          )}
          tone="baby"
        />
        <StatCard
          label={copy.guests.totalGuests}
          value={String(sideSummary.assigned.people)}
          hint={copy.guests.invitationRecords.replace(
            "{count}",
            String(sideSummary.assigned.records),
          )}
          tone="neutral"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={copy.guests.invited}
          value={String(invited)}
          hint={copy.guests.invitedHint}
        />
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

      <Card
        className={
          overTarget
            ? "border-rose-200 bg-rose-50/70"
            : "border-olive-100 bg-olive-50/45"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.guests.targetTitle}
            </p>
            <p className="mt-1 font-heading text-xl font-semibold text-ink">
              {hasTarget
                ? copy.guests.targetProgress
                    .replace("{invited}", String(invited))
                    .replace("{target}", String(target))
                : copy.guests.targetUnset}
            </p>
          </div>
          {!hasTarget ? (
            <Link
              href="/wedding/settings"
              className="rounded-xl border border-olive-200 bg-white px-3 py-2 text-xs font-medium text-olive-700 hover:bg-olive-50"
            >
              {copy.guests.manageTarget}
            </Link>
          ) : null}
        </div>

        {hasTarget ? (
          <>
            <div className="mt-3">
              <Progress value={targetProgress} />
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                overTarget ? "text-rose-700" : "text-olive-700"
              }`}
            >
              {overTarget
                ? copy.guests.targetOver.replace(
                    "{count}",
                    String(Math.abs(remaining ?? 0)),
                  )
                : remaining === 0
                  ? copy.guests.targetReached
                  : copy.guests.targetRemaining.replace(
                      "{count}",
                      String(remaining ?? 0),
                    )}
            </p>
          </>
        ) : null}
        <p className="mt-2 text-xs text-ink-soft">{copy.guests.targetHint}</p>
      </Card>

      <Card>
        <GuestManager guests={guests} copy={copy} locale={locale} />
      </Card>
    </div>
  );
}
