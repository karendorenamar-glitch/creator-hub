import { PageHeader } from "@/components/wedding/ui";
import { DebtPaymentForm } from "@/components/debt/payment-form";
import { DebtPaymentHistory } from "@/components/debt/payment-history";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import { loadDebtData } from "@/lib/debt/queries";
import { buildAccountBalances } from "@/lib/debt/calculations";
import { todayISO } from "@/lib/debt/format";

export const metadata = { title: "Pembayaran" };

export default async function DebtPaymentsPage() {
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const balances = buildAccountBalances(
    data.accounts,
    data.payments,
    data.schedules,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran"
        subtitle="Catat pembayaran sebagian atau penuh sebagai transaksi terpisah. Pembayaran yang dibatalkan tetap tersimpan sebagai riwayat."
      />
      <DebtPaymentForm
        accounts={balances.filter((account) => account.status !== "closed")}
        schedules={data.schedules}
        today={todayISO()}
      />
      <section className="space-y-3">
        <h2 className="font-heading text-xl text-ink">Riwayat pembayaran</h2>
        <DebtPaymentHistory payments={data.payments} accounts={balances} />
      </section>
    </div>
  );
}
