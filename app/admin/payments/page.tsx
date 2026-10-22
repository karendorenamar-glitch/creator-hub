import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { retryEmailAction } from "@/app/admin/payments/actions";
import { PaymentDecision } from "@/components/wedding/admin/payment-decision";
import { Badge, Card } from "@/components/wedding/ui";
import { formatDateTime, formatIDR } from "@/lib/wedding/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { requireAdmin } from "@/lib/wedding/admin";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Admin — Pembayaran" };
export const dynamic = "force-dynamic";

const STATUSES = ["pending_review", "approved", "rejected"] as const;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();
  const supabase = await createWeddingClient();

  const locale = await getLocale();
  const { status, q, page } = await searchParams;
  const search = (q ?? "").trim().slice(0, 60);
  const currentPage = Math.max(1, Number(page) || 1);
  const PAGE_SIZE = 20;
  const filter = STATUSES.includes(status as (typeof STATUSES)[number])
    ? (status as (typeof STATUSES)[number])
    : "pending_review";

  let query = supabase
    .from("payments")
    .select("*")
    .eq("status", filter)
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      `reference.ilike.%${search}%,sender_name.ilike.%${search}%`,
    );
  }

  const { data: payments } = await query;
  const allRows = payments ?? [];
  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const rows = allRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const receiptPaths = rows
    .map((row) => row.receipt_path)
    .filter((path): path is string => Boolean(path));
  const signed = receiptPaths.length
    ? await supabase.storage
        .from("payment-receipts")
        .createSignedUrls(receiptPaths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urls = new Map(
    (signed.data ?? [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path as string, item.signedUrl]),
  );

  // Customer emails live in auth.users: server-only lookup with the service key.
  const emails = new Map<string, string>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    for (const id of Array.from(new Set(rows.map((row) => row.user_id)))) {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) emails.set(id, data.user.email);
    }
  }

  return (
    <div className="wedding-app wedding-surface min-h-screen px-4 py-10 text-cocoa sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-rosewood">
              Admin
            </p>
            <h1 className="mt-2 font-heading text-3xl">Verifikasi Pembayaran</h1>
            <p className="text-sm text-cocoa/60">
              Cocokkan nama pengirim dan nominal dengan mutasi rekening BCA
              sebelum menyetujui.
            </p>
          </div>
          <Link href="/wedding/dashboard" className="text-sm text-rosewood hover:underline">
            Kembali ke aplikasi
          </Link>
        </div>

        <form action="/admin/payments" className="flex flex-wrap gap-2">
          <input type="hidden" name="status" value={filter} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Cari referensi atau nama pengirim…"
            className="min-w-56 flex-1 rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
          />
          <button
            type="submit"
            className="rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa"
          >
            Cari
          </button>
          {search ? (
            <Link
              href={`/admin/payments?status=${filter}`}
              className="rounded-full border border-blush px-4 py-2.5 text-sm text-cocoa/65 hover:bg-blush/40"
            >
              Reset
            </Link>
          ) : null}
        </form>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((value) => (
            <Link
              key={value}
              href={`/admin/payments?status=${value}`}
              className={`rounded-full border px-4 py-2 text-xs ${
                filter === value
                  ? "border-rosewood bg-rosewood text-ivory"
                  : "border-blush bg-ivory text-cocoa/70"
              }`}
            >
              {value.replace("_", " ")}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-cocoa/60">
              Tidak ada pembayaran pada status ini.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg">{row.reference}</p>
                    <p className="text-xs text-cocoa/55">
                      {emails.get(row.user_id) ?? "email tidak tersedia"} ·{" "}
                      {formatDateTime(row.submitted_at, locale)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      row.status === "approved"
                        ? "success"
                        : row.status === "rejected"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {row.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid gap-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-cocoa/55">Pengirim: </span>
                    <strong>{row.sender_name}</strong>
                  </p>
                  <p>
                    <span className="text-cocoa/55">Nominal: </span>
                    <strong>{formatIDR(row.amount_idr)}</strong>
                  </p>
                  <p>
                    <span className="text-cocoa/55">Email: </span>
                    {row.email_status} ({row.email_attempts}x)
                  </p>
                  {row.rejection_reason ? (
                    <p>
                      <span className="text-cocoa/55">Alasan: </span>
                      {row.rejection_reason}
                    </p>
                  ) : null}
                </div>

                {row.receipt_path && urls.get(row.receipt_path) ? (
                  <a
                    href={urls.get(row.receipt_path) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-blush px-4 py-2 text-xs text-rosewood hover:bg-blush/40"
                  >
                    Lihat bukti transfer
                  </a>
                ) : (
                  <p className="text-xs text-cocoa/45">Bukti tidak tersedia.</p>
                )}

                {row.status === "pending_review" ? (
                  <PaymentDecision paymentId={row.id} />
                ) : null}

                {row.email_status !== "sent" ? (
                  <form action={retryEmailAction}>
                    <input type="hidden" name="paymentId" value={row.id} />
                    <button
                      type="submit"
                      className="text-xs text-cocoa/55 underline underline-offset-4 hover:text-cocoa"
                    >
                      Kirim ulang email notifikasi
                    </button>
                  </form>
                ) : null}
              </Card>
            ))}

          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cocoa/55">
        <span>
          Halaman {safePage} dari {pageCount}
        </span>
        <div className="flex gap-2">
          {safePage > 1 ? (
            <Link
              href={`/admin/payments?status=${filter}&page=${safePage - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              className="rounded-full border border-blush px-3 py-1.5"
            >
              Sebelumnya
            </Link>
          ) : null}
          {safePage < pageCount ? (
            <Link
              href={`/admin/payments?status=${filter}&page=${safePage + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              className="rounded-full border border-blush px-3 py-1.5"
            >
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-cocoa/45">
        Filter status: {filter.replace("_", " ")} · pendapatan KPI hanya menghitung
        pembayaran berstatus approved.
      </p>
    </div>
  );
}