import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/wedding/ui";
import { WeddingDetailsForm } from "@/components/wedding/wedding-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Wedding Settings" };

export default async function WeddingSettingsPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const copy = weddingCopy[await getLocale()];
  const wedding = session.wedding;

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
    </div>
  );
}
