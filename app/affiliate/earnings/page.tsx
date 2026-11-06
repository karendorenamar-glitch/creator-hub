import Link from "next/link";
import { redirect } from "next/navigation";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadAffiliate } from "@/lib/affiliate/session";

type Commission = {
  id: string;
  payment_reference: string | null;
  currency: string;
  original_payment_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

const money = (currency: string, value: number) =>
  currency === "USD"
    ? `$${Number(value).toFixed(2)}`
    : `Rp${Math.round(Number(value)).toLocaleString("id-ID")}`;

export default async function AffiliateEarningsPage() {
  const supabase = await createWeddingClient();
  const affiliate = await loadAffiliate(supabase);
  if (!affiliate) redirect("/affiliate/login");

  const { data } = await supabase
    .from("affiliate_commissions")
    .select(
      "id, payment_reference, currency, original_payment_amount, commission_rate, commission_amount, status, created_at",
    )
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Commission[];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14">
      <h1 className="font-heading text-3xl text-ink">Earnings</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Commission is created only after Kefoo approves a customer payment.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-blush/60 bg-white p-6 text-sm text-ink-soft">
          No commission yet. Share your referral link to get started.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-blush/60 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-blush/40 text-ink-soft">
              <tr>
                {["Date", "Payment", "Purchase", "Rate", "Commission", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-blush/20 last:border-0">
                  <td className="px-4 py-3 text-ink-soft">{row.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-ink">{row.payment_reference ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{money(row.currency, row.original_payment_amount)}</td>
                  <td className="px-4 py-3 text-ink-soft">{Math.round(Number(row.commission_rate) * 100)}%</td>
                  <td className="px-4 py-3 font-medium text-ink">{money(row.currency, row.commission_amount)}</td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/affiliate/dashboard" className="mt-8 inline-block text-xs text-ink-soft underline">
        ← Back to dashboard
      </Link>
    </main>
  );
}
