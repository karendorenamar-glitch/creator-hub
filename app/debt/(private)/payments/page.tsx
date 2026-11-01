import { PageHeader } from "@/components/wedding/ui";
import { DebtPaymentForm } from "@/components/debt/payment-form";
import { DebtPaymentHistory } from "@/components/debt/payment-history";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import { loadDebtData } from "@/lib/debt/queries";
import {
  buildAccountSummaries,
  buildInstallments,
} from "@/lib/debt/calculations";
import { todayISO } from "@/lib/debt/format";
import { isUuid } from "@/lib/wedding/validation";

export const metadata = { title: "Pembayaran" };

export default async function DebtPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; schedule?: string }>;
}) {
  const params = await searchParams;
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const today = todayISO();
  const openAccounts = data.accounts.filter(
    (account) => account.status !== "closed",
  );
  const accounts = buildAccountSummaries(
    openAccounts,
    data.payments,
    data.schedules,
    today,
  );
  const installments = buildInstallments(
    openAccounts,
    data.schedules,
    data.payments,
    today,
  ).filter((item) => item.status !== "cancelled");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran"
        subtitle="Catat pembayaran penuh atau sebagian pada angsuran tertentu. Pembayaran yang dibatalkan tetap tersimpan sebagai riwayat."
      />
      <DebtPaymentForm
        accounts={accounts}
        installments={installments}
        defaultAccountId={
          params.account && isUuid(params.account) ? params.account : ""
        }
        defaultScheduleId={
          params.schedule && isUuid(params.schedule) ? params.schedule : ""
        }
        today={today}
      />
      <section className="space-y-3">
        <h2 className="font-heading text-xl text-ink">Riwayat pembayaran</h2>
        <DebtPaymentHistory payments={data.payments} accounts={accounts} />
      </section>
    </div>
  );
}
