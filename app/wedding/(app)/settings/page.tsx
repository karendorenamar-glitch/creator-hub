import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/wedding/ui";
import { CurrencySelector } from "@/components/wedding/settings/currency-selector";
import { WeddingDetailsForm } from "@/components/wedding/wedding-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { loadCustomerCountry } from "@/lib/wedding/country";
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
  const country = await loadCustomerCountry(supabase, session.userId);

  return (
    <div className="space-y-7">
      <PageHeader title={copy.settings.title} subtitle={copy.settings.subtitle} />

      <Card className="max-w-3xl">
        <WeddingDetailsForm
          copy={copy}
          mode="update"
          country={country}
          values={{
            partnerOne: wedding.partner_one_name,
            partnerTwo: wedding.partner_two_name ?? "",
            weddingDate: wedding.wedding_date ?? "",
            location: wedding.location ?? "",
            estimatedGuests:
              wedding.estimated_guest_count === null
                ? ""
                : String(wedding.estimated_guest_count),
            totalBudget: wedding.total_budget,
            stateCode: wedding.state_code ?? null,
            partnerNationality: wedding.partner_nationality ?? null,
            notes: wedding.notes ?? "",
          }}
        />
      </Card>

      <Card className="max-w-3xl space-y-4">
        <div>
          <h2 className="font-heading text-lg text-ink">
            {locale === "en" ? "Currency Preference" : "Preferensi Mata Uang"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {locale === "en"
              ? "Choose the currency you want to use throughout your wedding planner."
              : "Pilih mata uang yang ingin dipakai di seluruh wedding planner Anda."}
          </p>
        </div>

        <CurrencySelector locale={locale} />

        <p className="text-xs leading-relaxed text-ink-soft">
          {locale === "en"
            ? "Display only. Your checkout price, payment currency, and payment status never change."
            : "Hanya untuk tampilan. Harga checkout, mata uang pembayaran, dan status pembayaran tidak berubah."}
        </p>
      </Card>
    </div>
  );
}
