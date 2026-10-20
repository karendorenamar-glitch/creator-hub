import { redirect } from "next/navigation";
import { WeddingShell } from "@/components/wedding/shell";
import { getLocale } from "@/lib/i18n/get-locale";
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

  const locale = await getLocale();
  const copy = weddingCopy[locale];

  return (
    <WeddingShell
      copy={copy}
      locale={locale}
      couple={coupleNames(session.wedding)}
      weddingDateLabel={formatWeddingDate(session.wedding.wedding_date, locale)}
      isActive={session.hasPlanningAccess}
    >
      {children}
    </WeddingShell>
  );
}
