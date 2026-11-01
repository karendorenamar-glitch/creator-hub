import { PageHeader } from "@/components/wedding/ui";
import { DebtScheduleManager } from "@/components/debt/schedule-manager";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import { loadDebtData } from "@/lib/debt/queries";
import {
  buildAccountSummaries,
  monthlySummary,
} from "@/lib/debt/calculations";
import { monthKey, todayISO } from "@/lib/debt/format";
import { isUuid } from "@/lib/wedding/validation";

export const metadata = { title: "Jadwal Angsuran" };

export default async function DebtSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const today = todayISO();
  const requestedMonth = params.month ?? "";
  const month = /^\d{4}-\d{2}$/.test(requestedMonth)
    ? requestedMonth
    : monthKey(today);
  const selectedAccountId =
    params.account && isUuid(params.account) ? params.account : "";
  const visibleAccounts = data.accounts.filter(
    (account) =>
      account.status !== "closed" &&
      (!selectedAccountId || account.id === selectedAccountId),
  );
  const accounts = buildAccountSummaries(
    visibleAccounts,
    data.payments,
    data.schedules,
    today,
  );
  const summary = monthlySummary(
    month,
    visibleAccounts,
    data.payments,
    data.schedules,
    today,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal angsuran"
        subtitle="Pilih bulan untuk melihat tagihan, pembayaran, dan sisa setiap angsuran. Nominal boleh berbeda tiap bulan."
      />
      <DebtScheduleManager
        month={month}
        installments={summary.installments}
        counts={summary.counts}
        summary={{
          scheduled: summary.scheduled,
          paid: summary.paid,
          remaining: summary.remaining,
        }}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
      />
    </div>
  );
}
