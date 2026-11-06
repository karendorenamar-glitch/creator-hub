import Link from "next/link";
import { redirect } from "next/navigation";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadAffiliate } from "@/lib/affiliate/session";

const money = (currency: string, value: number) =>
  currency === "USD"
    ? `$${Number(value).toFixed(2)}`
    : `Rp${Math.round(Number(value)).toLocaleString("id-ID")}`;

const paymentLabel = (row: {
  payments_total: number;
  payments_approved: number;
  payments_pending: number;
  payments_rejected: number;
}) => {
  if (row.payments_total === 0) return "Not paid yet";
  if (row.payments_approved > 0) return "Approved";
  if (row.payments_pending > 0) return "Waiting for review";
  if (row.payments_rejected > 0) return "Rejected";
  return "Not paid yet";
};

type Row = {
  customer_reference: string | null;
  attributed_at: string;
  signup_completed_at: string | null;
  payments_total: number;
  payments_approved: number;
  payments_pending: number;
  payments_rejected: number;
  commission_idr: number;
  commission_usd: number;
};

export default async function AffiliateReferralsPage() {
  const supabase = await createWeddingClient();
  const affiliate = await loadAffiliate(supabase);
  if (!affiliate) redirect("/affiliate/login");

  const { data, error } = await supabase.rpc("affiliate_referrals_overview");
  const rows = (error ? [] : ((data ?? []) as Row[]));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14">
      <h1 className="font-heading text-3xl text-ink">Referrals</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Customers who signed up through your link. A signup alone earns nothing.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-blush/60 bg-white p-6 text-sm text-ink-soft">
          No referral yet. Share your link to get started.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-blush/60 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-blush/40 text-ink-soft">
              <tr>
                {["Customer", "Signup", "Payment", "Approved", "Commission"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.customer_reference}-${index}`} className="border-b border-blush/20 last:border-0">
                  <td className="px-4 py-3 text-ink">{row.customer_reference ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {(row.signup_completed_at ?? row.attributed_at).slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{paymentLabel(row)}</td>
                  <td className="px-4 py-3 text-ink">{row.payments_approved}</td>
                  <td className="px-4 py-3 text-ink">
                    {Number(row.commission_idr) > 0 ? money("IDR", row.commission_idr) : null}
                    {Number(row.commission_idr) > 0 && Number(row.commission_usd) > 0 ? " + " : null}
                    {Number(row.commission_usd) > 0 ? money("USD", row.commission_usd) : null}
                    {Number(row.commission_idr) === 0 && Number(row.commission_usd) === 0 ? "—" : null}
                  </td>
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
