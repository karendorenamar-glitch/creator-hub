import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/wedding/brand-logo";
import { WeddingDetailsForm } from "@/components/wedding/wedding-form";
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
        <WeddingDetailsForm copy={copy} mode="create" next={next} refCode={ref} />
      </Card>
    </div>
  );
}
