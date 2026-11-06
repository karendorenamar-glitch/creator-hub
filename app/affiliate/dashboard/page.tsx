import Link from "next/link";
import { redirect } from "next/navigation";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadAffiliate } from "@/lib/affiliate/session";
import { loadAffiliateStats } from "@/lib/affiliate/stats";
import { PayoutForm } from "@/components/affiliate/payout-form";

const money = (currency: string, value: number) =>
  currency === "USD"
    ? `$${value.toFixed(2)}`
    : `Rp${Math.round(value).toLocaleString("id-ID")}`;

type Balance = {
  currency: string;
  commissions_count: number;
  earned: number;
  reserved: number;
  paid: number;
  available: number;
  pending_payout: number;
};

export default async function AffiliateDashboardPage() {
  const supabase = await createWeddingClient();
  const affiliate = await loadAffiliate(supabase);
  if (!affiliate) redirect("/affiliate/login");

  const { data } = await supabase.rpc("affiliate_balances", {
    p_affiliate_id: affiliate.id,
  });
  const stats = await loadAffiliateStats(supabase, affiliate.id);
  const { data: payoutRows } = await supabase
    .from("affiliate_payouts")
    .select("id, currency, amount, status, requested_at, paid_at, transfer_reference, rejection_reason")
    .eq("affiliate_id", affiliate.id)
    .order("requested_at", { ascending: false })
    .limit(20);
  const payouts = (payoutRows ?? []) as {
    id: string;
    currency: string;
    amount: number;
    status: string;
    requested_at: string;
    paid_at: string | null;
    transfer_reference: string | null;
    rejection_reason: string | null;
  }[];
  const balances = ((data ?? []) as Balance[]).filter(
    (row) => row.currency === "IDR" || row.currency === "USD",
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14">
      <p className="text-[11px] uppercase tracking-[0.3em] text-rosewood">Affiliate</p>
      <h1 className="mt-3 font-heading text-3xl text-ink">
        Hi, {affiliate.full_name.split(" ")[0]}! ✨
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Welcome to your little corner of Kefoo.
      </p>

      <div className="mt-8 rounded-2xl border border-blush/60 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Your referral link</p>
        <p className="mt-2 break-all text-sm font-medium text-ink">
          https://www.kefoo.tech/ref/{affiliate.referral_code}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total clicks", String(stats.clicks)],
          ["Total sign ups", String(stats.signups)],
          ["Approved payments", String(stats.approvedPayments)],
          ["Signup conversion", `${stats.signupRate}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-blush/60 bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">{label}</p>
            <p className="mt-2 font-heading text-2xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {["IDR", "USD"].map((currency) => {
        const row = balances.find((item) => item.currency === currency);
        const earned = Number(row?.earned ?? 0);
        const available = Number(row?.available ?? 0);
        const pending = Number(row?.pending_payout ?? 0);
        const paid = Number(row?.paid ?? 0);

        return (
          <section key={currency} className="mt-8">
            <h2 className="font-heading text-xl text-ink">
              {currency === "IDR" ? "Indonesia (IDR)" : "International (USD)"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Commission earned", money(currency, earned)],
                ["Available", money(currency, available)],
                ["Pending payout", money(currency, pending)],
                ["Already paid", money(currency, paid)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-blush/60 bg-white p-5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">{label}</p>
                  <p className="mt-2 font-heading text-xl text-ink">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {Number(row?.commissions_count ?? 0)} approved payment(s)
            </p>
          </section>
        );
      })}

      <p className="mt-10 rounded-xl bg-champagne/20 px-4 py-3 text-xs leading-relaxed text-cocoa">
        You earn 20% only after a customer pays <strong>and</strong> Kefoo approves
        that payment. Signups, uploads and pending reviews earn Rp0.
      </p>

      <section className="mt-10 rounded-2xl border border-blush/60 bg-white p-6">
        <h2 className="font-heading text-xl text-ink">Request payout</h2>
        <p className="mt-1 text-xs text-ink-soft">
          IDR and USD are paid separately. The amount is validated against your ledger balance.
        </p>
        <PayoutForm
          bankName={affiliate.bank_name ?? ""}
          accountHolder={affiliate.account_holder_name ?? affiliate.full_name}
          accountNumber={affiliate.bank_account_number ?? ""}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl text-ink">Payout history</h2>
        {payouts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-blush/60 bg-white p-5 text-xs text-ink-soft">
            No payout requested yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-blush/60 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-blush/40 text-ink-soft">
                <tr>
                  {["Requested", "Amount", "Status", "Paid", "Reference / note"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((row) => (
                  <tr key={row.id} className="border-b border-blush/20 last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{row.requested_at.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-ink">{money(row.currency, row.amount)}</td>
                    <td className="px-4 py-3 capitalize text-ink-soft">{row.status}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.paid_at ? row.paid_at.slice(0, 10) : "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {row.transfer_reference ?? row.rejection_reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link href="/affiliate" className="mt-8 inline-block text-xs text-ink-soft underline">
        ← Back to Affiliate Program
      </Link>
    </main>
  );
}
