import { redirect } from "next/navigation";
import { SignInForm } from "@/components/wedding/auth-forms";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { getCurrentUser, loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Sign in" };

export default async function WeddingLoginPage() {
  const user = await getCurrentUser();

  if (user) {
    const session = await loadWeddingSession();
    redirect(session ? "/wedding/dashboard" : "/wedding/onboarding");
  }

  const copy = weddingCopy[await getLocale()];

  return (
    <div className="rounded-3xl border border-olive-100 bg-white p-7 shadow-[0_24px_70px_-50px_rgba(120,80,60,0.45)] sm:p-9">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        {copy.auth.signInTitle}
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">
        {copy.auth.signInSubtitle}
      </p>
      <SignInForm copy={copy} />
    </div>
  );
}
