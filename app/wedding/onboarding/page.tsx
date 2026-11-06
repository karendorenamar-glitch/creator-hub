import { loadCustomerCountry } from "@/lib/wedding/country";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/wedding/brand-logo";
import { WeddingDetailsForm } from "@/components/wedding/wedding-form";
import { CurrencyProvider } from "@/components/wedding/currency-provider";
import { getCurrencyContext } from "@/lib/currency/server";
import { Card } from "@/components/wedding/ui";
import { signOutAction } from "@/app/wedding/actions";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import {
  loadAccountContext,
  loadWeddingSession,
} from "@/lib/wedding/session";

export const metadata = { title: "Set up your wedding" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; ref?: string }>;
}) {
  const account = await loadAccountContext();
  if (!account) redirect("/wedding/login");

  // Already onboarded.
  const session = await loadWeddingSession();
  if (session) redirect("/wedding/dashboard");

  // Pay first: onboarding is locked until the payment is approved.
  if (!account.hasEntitlement) redirect("/checkout");

  const copy = weddingCopy[await getLocale()];
  const { next, ref } = await searchParams;

  // Country decides whether the Malaysian state selector is shown.
  const supabase = await createWeddingClient();
  const country = await loadCustomerCountry(supabase, account.userId);
  // Onboarding lives outside the (app) layout, so it needs its own provider;
  // otherwise useMoney falls back to IDR instead of the customer currency.
  const currencyContext = await getCurrencyContext(
    supabase,
    account.userId,
    country,
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <BrandLogo />
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            {copy.nav.signOut}
          </button>
        </form>
      </div>

      <Card className="p-7 sm:p-9">
        <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">
          {copy.onboarding.title}
        </h1>
        <p className="mt-2 mb-7 text-sm leading-relaxed text-ink-soft">
          {copy.onboarding.subtitle}
        </p>
        <CurrencyProvider
          currency={currencyContext.currency}
          rates={currencyContext.rates}
          ratesAvailable={currencyContext.ratesAvailable}
          fetchedAt={currencyContext.fetchedAt}
        >
          <WeddingDetailsForm
            copy={copy}
            mode="create"
            next={next}
            refCode={ref}
            country={country}
          />
        </CurrencyProvider>
      </Card>
    </div>
  );
}
