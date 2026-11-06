import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, StatCard } from "@/components/wedding/ui";
import { requireAdmin } from "@/lib/wedding/admin";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { deleteAffiliate, setAffiliateStatus } from "../actions";

export const dynamic = "force-dynamic";

const money = (currency: string, value: number) =>
  currency === "USD"
    ? `$${Number(value).toFixed(2)}`
    : `Rp${Math.round(Number(value)).toLocaleString("id-ID")}`;

const mask = (value: string | null) =>
  value && value.length >= 4 ? `•••• ${value.slice(-4)}` : "—";

export default async function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ affiliate_id: string }>;
}) {
  await requireAdmin();
  const { affiliate_id } = await params;
  const supabase = await createWeddingClient();

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("id", affiliate_id)
    .maybeSingle();

  if (!affiliate) notFound();

  const [clicks, referrals, commissions, payouts] = await Promise.all([
    supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate_id),
    supabase.from("affiliate_referrals").select("customer_reference, attributed_at, signup_completed_at").eq("affiliate_id", affiliate_id).order("attributed_at", { ascending: false }),
    supabase.from("affiliate_commissions").select("payment_reference, currency, original_payment_amount, commission_amount, status, created_at").eq("affiliate_id", affiliate_id).order("created_at", { ascending: false }),
    supabase.from("affiliate_payouts").select("currency, amount, status, requested_at, paid_at, transfer_reference, bank_name, account_holder_name, bank_account_number, rejection_reason").eq("affiliate_id", affiliate_id).order("requested_at", { ascending: false }),
  ]);

  const referralRows = referrals.data ?? [];
  const commissionRows = commissions.data ?? [];
  const payoutRows = payouts.data ?? [];
  const mine = commissionRows.filter((row) => row.status !== "reversed");

  const commissionIdr = mine.filter((r) => r.currency === "IDR").reduce((s, r) => s + Number(r.commission_amount), 0);
  const commissionUsd = mine.filter((r) => r.currency === "USD").reduce((s, r) => s + Number(r.commission_amount), 0);
  const pendingIdr = payoutRows.filter((r) => r.currency === "IDR" && r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const pendingUsd = payoutRows.filter((r) => r.currency === "USD" && r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const paidIdr = payoutRows.filter((r) => r.currency === "IDR" && r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
  const paidUsd = payoutRows.filter((r) => r.currency === "USD" && r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  const totalClicks = clicks.count ?? 0;
  const totalSignups = referralRows.length;
  const signupRate = totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 1000) / 10 : 0;
  const paymentRate = totalSignups > 0 ? Math.round((mine.length / totalSignups) * 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/affiliates" className="text-xs text-cocoa/60 underline">← All affiliates</Link>
          <h1 className="mt-2 font-heading text-3xl">{affiliate.full_name}</h1>
          <p className="text-sm text-cocoa/60">{affiliate.email} · kode <strong>{affiliate.referral_code}</strong> · {affiliate.status}</p>
        </div>
        <p className="text-xs text-cocoa/60">https://www.kefoo.tech/ref/{affiliate.referral_code}</p>
      </div>

      <Card className="space-y-3">
        <p className="text-xs text-cocoa/60">Status: <strong className="capitalize">{affiliate.status}</strong></p>
        {affiliate.status === "active" ? (
          <form action={setAffiliateStatus} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="affiliateId" value={affiliate.id} />
            <input type="hidden" name="status" value="suspended" />
            <label className="text-[11px] text-cocoa/70">Reason
              <input name="reason" className="mt-1 block w-64 rounded-lg border border-olive-100 px-2 py-1.5 text-xs" />
            </label>
            <button className="rounded-full border border-rose-300 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50">
              Suspend affiliate
            </button>
          </form>
        ) : (
          <form action={setAffiliateStatus}>
            <input type="hidden" name="affiliateId" value={affiliate.id} />
            <input type="hidden" name="status" value="active" />
            <button className="rounded-full border border-olive-200 px-4 py-2 text-xs text-olive-800 hover:bg-olive-50">
              Activate affiliate
            </button>
          </form>
        )}

        {commissionRows.length === 0 && payoutRows.length === 0 ? (
          <form action={deleteAffiliate} className="space-y-1">
            <input type="hidden" name="affiliateId" value={affiliate.id} />
            <label className="flex items-center gap-2 text-[11px] text-cocoa/70">
              <input type="checkbox" name="deleteLogin" value="yes" />
              Also delete the login account (email can register again)
            </label>
            <button className="text-[11px] text-rose-600 underline">
              Delete affiliate (clicks and referrals are removed too)
            </button>
          </form>
        ) : (
          <p className="text-[11px] text-cocoa/50">
            This affiliate has commission or payout history, so it cannot be deleted. Suspend it instead.
          </p>
        )}
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clicks" value={String(totalClicks)} />
        <StatCard label="Sign ups" value={String(totalSignups)} tone="champagne" />
        <StatCard label="Approved payments" value={String(mine.length)} />
        <StatCard label="Signup rate" value={`${signupRate}%`} hint={`Payment rate ${paymentRate}%`} />
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="space-y-1">
          <p className="text-xs text-cocoa/60">Commission (IDR · USD)</p>
          <p className="font-heading text-xl">{money("IDR", commissionIdr)} · {money("USD", commissionUsd)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-cocoa/60">Pending · Paid (IDR · USD)</p>
          <p className="font-heading text-xl">
            {money("IDR", pendingIdr)} · {money("USD", pendingUsd)} → {money("IDR", paidIdr)} · {money("USD", paidUsd)}
          </p>
        </Card>
      </div>

      <Card className="space-y-1">
        <p className="text-xs text-cocoa/60">Bank account (admin only)</p>
        <p className="text-sm">{affiliate.bank_name ?? "—"} · {affiliate.account_holder_name ?? "—"} · {mask(affiliate.bank_account_number)}</p>
      </Card>

      <section>
        <h2 className="font-heading text-xl">Signup progress</h2>
        {referralRows.length === 0 ? (
          <p className="mt-2 text-xs text-cocoa/60">No referral yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-2xl border border-olive-100 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-olive-100 text-cocoa/60"><tr>{["Customer", "Attributed", "Signup"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {referralRows.map((row, i) => (
                  <tr key={`${row.customer_reference}-${i}`} className="border-b border-olive-50 last:border-0">
                    <td className="px-4 py-3">{row.customer_reference ?? "—"}</td>
                    <td className="px-4 py-3 text-cocoa/60">{row.attributed_at.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-cocoa/60">{row.signup_completed_at ? row.signup_completed_at.slice(0, 10) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl">Payment progress</h2>
        {commissionRows.length === 0 ? (
          <p className="mt-2 text-xs text-cocoa/60">No approved payment yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-2xl border border-olive-100 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-olive-100 text-cocoa/60"><tr>{["Date", "Payment", "Purchase", "Commission", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {commissionRows.map((row, i) => (
                  <tr key={`${row.payment_reference}-${i}`} className="border-b border-olive-50 last:border-0">
                    <td className="px-4 py-3 text-cocoa/60">{row.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">{row.payment_reference ?? "—"}</td>
                    <td className="px-4 py-3">{money(row.currency, row.original_payment_amount)}</td>
                    <td className="px-4 py-3">{money(row.currency, row.commission_amount)}</td>
                    <td className="px-4 py-3 capitalize text-cocoa/60">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl">Payout history</h2>
        {payoutRows.length === 0 ? (
          <p className="mt-2 text-xs text-cocoa/60">No payout yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-2xl border border-olive-100 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-olive-100 text-cocoa/60"><tr>{["Requested", "Amount", "Status", "Paid", "Reference / note"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {payoutRows.map((row, i) => (
                  <tr key={i} className="border-b border-olive-50 last:border-0">
                    <td className="px-4 py-3 text-cocoa/60">{row.requested_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">{money(row.currency, row.amount)}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3 text-cocoa/60">{row.paid_at ? row.paid_at.slice(0, 10) : "—"}</td>
                    <td className="px-4 py-3 text-cocoa/60">{row.transfer_reference ?? row.rejection_reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
