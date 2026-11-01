import { PageHeader } from "@/components/wedding/ui";
import { DebtScheduleManager } from "@/components/debt/schedule-manager";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import { loadDebtData } from "@/lib/debt/queries";
import { buildAccountBalances } from "@/lib/debt/calculations";
import { todayISO } from "@/lib/debt/format";

export const metadata = { title: "Jadwal" };

export default async function DebtSchedulePage() {
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const balances = buildAccountBalances(data.accounts, data.payments);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal pembayaran"
        subtitle="Lihat tagihan yang akan datang dan yang sudah lewat. Status lunas hanya berubah otomatis dari pembayaran yang dihubungkan ke jadwal."
      />
      <DebtScheduleManager
        schedules={data.schedules}
        accounts={balances.filter((account) => account.status !== "closed")}
        today={todayISO()}
      />
    </div>
  );
}
