import { PageHeader } from "@/components/wedding/ui";
import { DebtAccountManager } from "@/components/debt/account-manager";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import {
  isDebtInstallmentPaymentReady,
  loadDebtData,
} from "@/lib/debt/queries";
import { buildAccountBalances } from "@/lib/debt/calculations";

export const metadata = { title: "Akun Utang" };

export default async function DebtAccountsPage() {
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const balances = buildAccountBalances(
    data.accounts,
    data.payments,
    data.schedules,
  );
  const paymentsReady = await isDebtInstallmentPaymentReady();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Akun utang"
        subtitle="Kelola pokok, bunga/biaya, jatuh tempo, dan status setiap akun. Riwayat pembayaran tidak akan dihapus saat akun ditutup."
      />
      <DebtAccountManager
        accounts={balances}
        paymentsReady={paymentsReady}
      />
    </div>
  );
}
