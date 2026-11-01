import { PageHeader } from "@/components/wedding/ui";
import { DebtAccountManager } from "@/components/debt/account-manager";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import { loadDebtData } from "@/lib/debt/queries";
import { buildAccountSummaries } from "@/lib/debt/calculations";
import { todayISO } from "@/lib/debt/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Utang" };

export default async function DebtAccountsPage() {
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const accounts = buildAccountSummaries(
    data.accounts,
    data.payments,
    data.schedules,
    todayISO(),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar utang"
        subtitle="Setiap utang punya jadwal angsuran sendiri. Nominal tiap bulan boleh berbeda, dan pembayaran dicatat per angsuran."
      />
      <DebtAccountManager accounts={accounts} />
    </div>
  );
}
