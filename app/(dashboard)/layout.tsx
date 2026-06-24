import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { requireOrganizationOrRedirect } from "@/app/actions/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getAuthUser } from "@/lib/org";
import { getUserGreetingName } from "@/lib/user-display";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrganizationOrRedirect();
  const [plan, authUser, locale] = await Promise.all([
    getDashboardPlanContext(),
    getAuthUser(),
    getLocale(),
  ]);

  const user = authUser
    ? {
        email: authUser.email ?? "",
        displayName: getUserGreetingName(authUser.user_metadata, authUser.email),
      }
    : null;

  return (
    <ToastProvider>
      <DashboardShell plan={plan} user={user} locale={locale}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
