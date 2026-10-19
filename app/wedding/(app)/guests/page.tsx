import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Guest List" };

export default async function GuestsPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");
  const copy = weddingCopy[await getLocale()];

  return (
    <div className="space-y-7">
      <PageHeader title={copy.placeholders.guests.title} />
      <Card>
        <EmptyState
          title={copy.common.comingSoon}
          body={copy.placeholders.guests.body}
          icon={<Users className="size-6" aria-hidden />}
        />
      </Card>
    </div>
  );
}
