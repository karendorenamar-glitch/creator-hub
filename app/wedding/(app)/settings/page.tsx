import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/wedding/ui";
import { saveDisplayCurrencyAction } from "@/app/wedding/actions";
import { CURRENCIES } from "@/lib/currency/currencies";
import { resolveDisplayCurrency } from "@/lib/currency/server";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadCustomerCountry } from "@/lib/wedding/country";
import { WeddingDetailsForm } from "@/components/wedding/wedding-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { loadWeddingSession } from "@/lib/wedding/session";

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
  const currency = await resolveDisplayCurrency(
    supabase,
    session.userId,
    country,
  );

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

        <form
          action={saveDisplayCurrencyAction}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="space-y-1.5 text-sm font-medium text-ink">
            {locale === "en" ? "Display currency" : "Mata uang tampilan"}
            <select
              name="currency"
              defaultValue={currency}
              className="block min-w-64 rounded-xl border border-olive-100 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-olive-400"
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.code} · {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
          >
            {locale === "en" ? "Save" : "Simpan"}
          </button>
        </form>

        <p className="text-xs leading-relaxed text-ink-soft">
          {locale === "en"
            ? "Display only. Your checkout price, payment currency, and payment status never change."
            : "Hanya untuk tampilan. Harga checkout, mata uang pembayaran, dan status pembayaran tidak berubah."}
        </p>
      </Card>
    </div>
  );
}
