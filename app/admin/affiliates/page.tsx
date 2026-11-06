import Link from "next/link";
import { Card, StatCard } from "@/components/wedding/ui";
import { requireAdmin } from "@/lib/wedding/admin";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Admin — Affiliates" };
export const dynamic = "force-dynamic";

const money = (currency: string, value: number) =>
  currency === "USD"
    ? `$${Number(value).toFixed(2)}`
    : `Rp${Math.round(Number(value)).toLocaleString("id-ID")}`;

type Affiliate = {
  id: string;
  full_name: string;
  email: string;
  referral_code: string;
  status: string;
  created_at: string;
};

export default async function AdminAffiliatesPage() {
  await requireAdmin();
  const supabase = await createWeddingClient();

  const [affiliatesResult, clicksResult, referralsResult, commissionsResult, payoutsResult] =
    await Promise.all([
      supabase
        .from("affiliates")
        .select("id, full_name, email, referral_code, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("affiliate_clicks").select("affiliate_id"),
      supabase.from("affiliate_referrals").select("affiliate_id"),
      supabase
        .from("affiliate_commissions")
        .select("affiliate_id, currency, commission_amount, status"),
      supabase.from("affiliate_payouts").select("affiliate_id, currency, amount, status"),
    ]);

  const affiliates = (affiliatesResult.data ?? []) as Affiliate[];
  const clicks = (clicksResult.data ?? []) as { affiliate_id: string }[];
  const referrals = (referralsResult.data ?? []) as { affiliate_id: string }[];
  const commissions = (commissionsResult.data ?? []) as {
    affiliate_id: string;
    currency: string;
    commission_amount: number;
    status: string;
  }[];
  const payouts = (payoutsResult.data ?? []) as {
    affiliate_id: string;
    currency: string;
    amount: number;
    status: string;
  }[];

  const countBy = (rows: { affiliate_id: string }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.affiliate_id, (map.get(row.affiliate_id) ?? 0) + 1);
    return map;
  };

  const clickCount = countBy(clicks);
  const signupCount = countBy(referrals);

  const rows = affiliates.map((affiliate) => {
    const mine = commissions.filter(
      (row) => row.affiliate_id === affiliate.id && row.status !== "reversed",
    );
    const myPayouts = payouts.filter(
      (row) => row.affiliate_id === affiliate.id && row.status === "pending",
    );

    return {
      ...affiliate,
      clicks: clickCount.get(affiliate.id) ?? 0,
      signups: signupCount.get(affiliate.id) ?? 0,
      approvedPayments: mine.length,
      commissionIdr: mine
        .filter((row) => row.currency === "IDR")
        .reduce((sum, row) => sum + Number(row.commission_amount), 0),
      commissionUsd: mine
        .filter((row) => row.currency === "USD")
        .reduce((sum, row) => sum + Number(row.commission_amount), 0),
      pendingIdr: myPayouts
        .filter((row) => row.currency === "IDR")
        .reduce((sum, row) => sum + Number(row.amount), 0),
      pendingUsd: myPayouts
        .filter((row) => row.currency === "USD")
        .reduce((sum, row) => sum + Number(row.amount), 0),
    };
  });

  const active = rows.filter((row) => row.status === "active").length;
  const totalSignups = referrals.length;
  const totalApproved = commissions.filter((row) => row.status !== "reversed").length;
  const commissionIdr = rows.reduce((sum, row) => sum + row.commissionIdr, 0);
  const commissionUsd = rows.reduce((sum, row) => sum + row.commissionUsd, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">Affiliate</p>
        <h1 className="mt-2 font-heading text-3xl">Affiliators</h1>
        <p className="text-sm text-cocoa/60">
          Commission is counted only from payments an admin approved.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total affiliators" value={String(rows.length)} />
        <StatCard label="Active" value={String(active)} tone="champagne" />
        <StatCard label="Referred sign ups" value={String(totalSignups)} />
        <StatCard label="Approved payments" value={String(totalApproved)} />
      </section>

      <Card className="space-y-1">
        <p className="text-xs text-cocoa/60">Commission generated</p>
        <p className="font-heading text-xl">
          {money("IDR", commissionIdr)} · {money("USD", commissionUsd)}
        </p>
        <p className="text-[11px] text-cocoa/50">IDR and USD are never combined into one balance.</p>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-cocoa/70">No affiliate registered yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-olive-100 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-olive-100 text-cocoa/60">
              <tr>
                {["Name", "Email", "Code", "Registered", "Clicks", "Sign ups", "Approved", "Commission", "Pending payout", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-olive-50 last:border-0">
                  <td className="px-4 py-3"><Link href={`/admin/affiliates/${row.id}`} className="underline">{row.full_name}</Link></td>
                  <td className="px-4 py-3 text-cocoa/70">{row.email}</td>
                  <td className="px-4 py-3 font-mono">{row.referral_code}</td>
                  <td className="px-4 py-3 text-cocoa/60">{row.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">{row.clicks}</td>
                  <td className="px-4 py-3">{row.signups}</td>
                  <td className="px-4 py-3">{row.approvedPayments}</td>
                  <td className="px-4 py-3">{money("IDR", row.commissionIdr)} · {money("USD", row.commissionUsd)}</td>
                  <td className="px-4 py-3">{money("IDR", row.pendingIdr)} · {money("USD", row.pendingUsd)}</td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
