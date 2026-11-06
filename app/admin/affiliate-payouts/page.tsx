import { Card, StatCard } from "@/components/wedding/ui";
import { requireAdmin } from "@/lib/wedding/admin";
import { createWeddingClient } from "@/lib/wedding/supabase";
import {
  markPayoutPaid,
  markPayoutProcessing,
  rejectPayout,
} from "./actions";

export const metadata = { title: "Admin — Affiliate payouts" };
export const dynamic = "force-dynamic";

const money = (currency: string, value: number) =>
  currency === "USD"
    ? `$${Number(value).toFixed(2)}`
    : `Rp${Math.round(Number(value)).toLocaleString("id-ID")}`;

const mask = (value: string) =>
  value.length >= 4 ? `•••• ${value.slice(-4)}` : "—";

export default async function AdminAffiliatePayoutsPage() {
  await requireAdmin();
  const supabase = await createWeddingClient();

  const [payoutsResult, affiliatesResult] = await Promise.all([
    supabase
      .from("affiliate_payouts")
      .select("id, affiliate_id, currency, amount, status, bank_name, account_holder_name, bank_account_number, requested_at, paid_at, transfer_reference, rejection_reason")
      .order("requested_at", { ascending: false })
      .limit(100),
    supabase.from("affiliates").select("id, full_name, email"),
  ]);

  const payouts = payoutsResult.data ?? [];
  const byId = new Map(
    (affiliatesResult.data ?? []).map((row) => [row.id, row]),
  );

  const pending = payouts.filter((row) => row.status === "pending");
  const processing = payouts.filter((row) => row.status === "processing");
  const paid = payouts.filter((row) => row.status === "paid");
  const rejected = payouts.filter((row) => row.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">Affiliate</p>
        <h1 className="mt-2 font-heading text-3xl">Affiliate payouts</h1>
        <p className="text-sm text-cocoa/60">
          Mark paid only after the transfer is done. USD payouts require the USD/IDR rate you used.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={String(pending.length)} hint={money("IDR", pending.filter((r) => r.currency === "IDR").reduce((s, r) => s + Number(r.amount), 0))} />
        <StatCard label="Processing" value={String(processing.length)} tone="champagne" />
        <StatCard label="Paid" value={String(paid.length)} />
        <StatCard label="Rejected" value={String(rejected.length)} />
      </section>

      {payouts.length === 0 ? (
        <Card><p className="text-sm text-cocoa/70">No payout request yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {payouts.map((row) => {
            const affiliate = byId.get(row.affiliate_id);
            const open = row.status === "pending" || row.status === "processing";
            return (
              <Card key={row.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{affiliate?.full_name ?? "—"} <span className="text-xs text-cocoa/60">{affiliate?.email}</span></p>
                    <p className="text-xs text-cocoa/60">
                      {row.requested_at.slice(0, 10)} · {row.bank_name} · {row.account_holder_name} · {mask(row.bank_account_number)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-lg">{money(row.currency, row.amount)}</p>
                    <p className="text-xs capitalize text-cocoa/60">{row.status}</p>
                  </div>
                </div>

                {row.status === "paid" ? (
                  <p className="text-xs text-cocoa/60">
                    Paid {row.paid_at?.slice(0, 10)} · ref {row.transfer_reference ?? "—"}
                  </p>
                ) : null}
                {row.status === "rejected" ? (
                  <p className="text-xs text-rose-700">Rejected: {row.rejection_reason ?? "—"}</p>
                ) : null}

                {open ? (
                  <div className="space-y-3 border-t border-olive-50 pt-3">
                    {row.status === "pending" ? (
                      <form action={markPayoutProcessing}>
                        <input type="hidden" name="payoutId" value={row.id} />
                        <button className="rounded-full border border-blush px-4 py-2 text-xs text-rosewood hover:bg-blush/40">
                          Mark processing
                        </button>
                      </form>
                    ) : null}

                    <details className="rounded-xl border border-olive-100 p-3">
                      <summary className="cursor-pointer text-xs font-medium text-ink">Mark as paid</summary>
                      <form action={markPayoutPaid} className="mt-3 grid gap-2 sm:grid-cols-2">
                        <input type="hidden" name="payoutId" value={row.id} />
                        <label className="text-[11px] text-cocoa/70">Transfer date
                          <input type="date" name="transferDate" required className="mt-1 w-full rounded-lg border border-olive-100 px-2 py-1.5 text-xs" />
                        </label>
                        <label className="text-[11px] text-cocoa/70">Transfer reference
                          <input name="transferReference" required className="mt-1 w-full rounded-lg border border-olive-100 px-2 py-1.5 text-xs" />
                        </label>
                        {row.currency === "USD" ? (
                          <label className="text-[11px] text-cocoa/70">USD/IDR rate used
                            <input name="exchangeRate" type="number" step="0.01" min="1" required className="mt-1 w-full rounded-lg border border-olive-100 px-2 py-1.5 text-xs" />
                          </label>
                        ) : null}
                        <label className="text-[11px] text-cocoa/70">Note (optional)
                          <input name="note" className="mt-1 w-full rounded-lg border border-olive-100 px-2 py-1.5 text-xs" />
                        </label>
                        <button className="rounded-full bg-rosewood px-4 py-2 text-xs text-ivory hover:bg-cocoa sm:col-span-2">
                          Confirm transfer done
                        </button>
                      </form>
                    </details>

                    <details className="rounded-xl border border-rose-200 p-3">
                      <summary className="cursor-pointer text-xs font-medium text-rose-700">Reject</summary>
                      <form action={rejectPayout} className="mt-3 space-y-2">
                        <input type="hidden" name="payoutId" value={row.id} />
                        <input name="reason" required placeholder="Reason" className="w-full rounded-lg border border-rose-200 px-2 py-1.5 text-xs" />
                        <button className="rounded-full border border-rose-300 px-4 py-2 text-xs text-rose-700">
                          Reject payout
                        </button>
                      </form>
                    </details>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
