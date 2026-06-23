import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { requireOrganizationOrRedirect } from "@/app/actions/org";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrganizationOrRedirect();
  const plan = await getDashboardPlanContext();

  return (
    <ToastProvider>
      <DashboardShell plan={plan}>{children}</DashboardShell>
    </ToastProvider>
  );
}
