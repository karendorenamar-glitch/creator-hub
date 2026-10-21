import { redirect } from "next/navigation";
import { WeddingShell } from "@/components/wedding/shell";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { formatWeddingDate } from "@/lib/wedding/format";
import {
  coupleNames,
  getCurrentUser,
  isSubscriptionActive,
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

  // Paywall: only enforced when the DB switch is on. Members with lifetime
  // access, an active subscription, or the open-access switch keep working.
  const hasAccess =
    !session.subscriptionRequired ||
    isSubscriptionActive(session.subscription) ||
    Boolean(session.wedding.lifetime_access_granted_at);

  if (!hasAccess) {
    redirect("/checkout");
  }

  const locale = await getLocale();
  const copy = weddingCopy[locale];

  // Sidebar shows the Admin link only for accounts listed in public.admins.
  let isAdmin = false;
  if (session) {
    const { createWeddingClient } = await import("@/lib/wedding/supabase");
    const supabase = await createWeddingClient();
    const { data } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", session.userId)
      .maybeSingle();
    isAdmin = Boolean(data);
  }

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
