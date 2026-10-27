import { redirect } from "next/navigation";
import { SeatingPlanner } from "@/components/wedding/seating/seating-planner";
import { Card, PageHeader } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadSeatingData } from "@/lib/wedding/seating-data";
import { loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Seating Arrangement" };

export default async function SeatingPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const data = await loadSeatingData(session.wedding.id);

  return (
    <div className="space-y-7">
      <PageHeader title={copy.seating.title} subtitle={copy.seating.subtitle} />

      {data.migrationRequired ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <p className="text-sm text-amber-900">{copy.seating.migrationRequired}</p>
        </Card>
      ) : data.loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <p className="text-sm text-rose-800">{copy.errors.generic}</p>
        </Card>
      ) : (
        <SeatingPlanner
          events={data.events}
          tables={data.tables}
          assignments={data.assignments}
          guests={data.guests}
          copy={copy}
          locale={locale}
        />
      )}
    </div>
  );
}
