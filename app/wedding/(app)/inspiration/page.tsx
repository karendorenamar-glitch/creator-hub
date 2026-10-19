import { redirect } from "next/navigation";
import { InspirationManager } from "@/components/wedding/inspiration/inspiration-manager";
import { SubscriptionNotice } from "@/components/wedding/subscription-notice";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { isSubscriptionActive, loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Inspiration" };

export default async function InspirationPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const { data } = await supabase
    .from("inspiration_items")
    .select("*")
    .order("created_at", { ascending: false });

  const items = data ?? [];
  const categoriesUsed = new Set(items.map((item) => item.category)).size;

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.inspiration.title}
        subtitle={copy.inspiration.subtitle}
      />

      <SubscriptionNotice
        active={isSubscriptionActive(session.subscription)}
        copy={copy}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={copy.inspiration.title}
          value={String(items.length)}
        />
        <StatCard
          label={copy.inspiration.category}
          value={String(categoriesUsed)}
          tone="champagne"
        />
      </section>

      <Card>
        <InspirationManager items={items} copy={copy} locale={locale} />
      </Card>
    </div>
  );
}
