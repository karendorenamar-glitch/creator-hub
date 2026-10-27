import { redirect } from "next/navigation";
import { WeddingShell } from "@/components/wedding/shell";
import { getLocale } from "@/lib/i18n/get-locale";
import { getAdminStatus } from "@/lib/wedding/admin-status";
import { weddingCopy } from "@/lib/wedding/copy";
import { formatWeddingDate } from "@/lib/wedding/format";
import {
  coupleNames,
  getCurrentUser,
  loadWeddingSession,
} from "@/lib/wedding/session";

export default async function WeddingAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await loadWeddingSession();

  if (!session) {
    const user = await getCurrentUser();
    redirect(user ? "/wedding/onboarding" : "/wedding/login");
  }

  // Single source of truth: hasPlanningAccess already accounts for the open
  // access switch, an active subscription, AND account-level lifetime access
  // (customers who paid before onboarding have no per-wedding flag yet).
  if (!session.hasPlanningAccess) {
    redirect("/checkout");
  }

  // Locale lookup and the optional admin badge are independent. Running them
  // together removes one serial round trip from every app page.
  const [locale, isAdmin] = await Promise.all([
    getLocale(),
    getAdminStatus(session.userId),
  ]);
  const copy = weddingCopy[locale];

  return (
    <WeddingShell
      copy={copy}
      locale={locale}
      couple={coupleNames(session.wedding)}
      weddingDateLabel={formatWeddingDate(session.wedding.wedding_date, locale)}
      isAdmin={isAdmin}
    >
      {children}
    </WeddingShell>
  );
}
