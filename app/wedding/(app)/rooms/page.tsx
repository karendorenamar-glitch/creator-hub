import { redirect } from "next/navigation";
import { RoomManager } from "@/components/wedding/rooms/room-manager";
import { Card, PageHeader } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadRoomsData } from "@/lib/wedding/rooms-data";
import { loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Room Arrangement" };

export default async function RoomsPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const data = await loadRoomsData(session.wedding.id);

  return (
    <div className="space-y-7">
      <PageHeader title={copy.rooms.title} subtitle={copy.rooms.subtitle} />

      {data.migrationRequired ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <p className="text-sm text-amber-900">{copy.rooms.migrationRequired}</p>
        </Card>
      ) : data.loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <p className="text-sm text-rose-800">{copy.errors.generic}</p>
        </Card>
      ) : (
        <RoomManager
          rooms={data.rooms}
          assignments={data.assignments}
          guests={data.guests}
          copy={copy}
        />
      )}
    </div>
  );
}
