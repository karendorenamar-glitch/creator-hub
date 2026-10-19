import { redirect } from "next/navigation";
import { SubscriptionNotice } from "@/components/wedding/subscription-notice";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { VendorManager } from "@/components/wedding/vendors/vendor-manager";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatIDR } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { isSubscriptionActive, loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const { data } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });

  const vendors = data ?? [];
  const booked = vendors.filter((v) => v.booking_status === "booked").length;
  const committed = vendors.reduce(
    (sum, v) => sum + Number(v.agreed_price ?? v.quoted_price ?? 0),
    0,
  );
  const paid = vendors.reduce((sum, v) => sum + Number(v.amount_paid), 0);

  return (
    <div className="space-y-7">
      <PageHeader title={copy.vendors.title} subtitle={copy.vendors.subtitle} />

      <SubscriptionNotice
        active={isSubscriptionActive(session.subscription)}
        copy={copy}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={copy.vendors.title} value={String(vendors.length)} />
        <StatCard
          label={copy.vendors.bookingStatus}
          value={`${booked} / ${vendors.length}`}
        />
        <StatCard
          label={copy.vendors.agreed}
          value={formatIDR(committed)}
          tone="champagne"
        />
        <StatCard
          label={copy.vendors.paid}
          value={formatIDR(paid)}
          hint={`${copy.vendors.remaining}: ${formatIDR(Math.max(0, committed - paid))}`}
        />
      </section>

      <Card>
        <VendorManager vendors={vendors} copy={copy} locale={locale} />
      </Card>
    </div>
  );
}
