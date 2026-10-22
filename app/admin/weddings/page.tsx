import Link from "next/link";
import { Badge, Card } from "@/components/wedding/ui";
import { requireAdmin } from "@/lib/wedding/admin";
import { formatWeddingDate } from "@/lib/wedding/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Admin — Weddings" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminWeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const { q, page } = await searchParams;

  const search = (q ?? "")
    .trim()
    .replace(/[(),%]/g, "")
    .slice(0, 120);
  const requestedPage = Math.max(1, Number(page) || 1);
  const supabase = await createWeddingClient();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("require_subscription")
    .eq("id", true)
    .maybeSingle();
  const openAccess = settings?.require_subscription === false;

  let query = supabase
    .from("weddings")
    .select(
      "id, created_by, partner_one_name, partner_two_name, wedding_date, created_at, lifetime_access_granted_at",
    )
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `partner_one_name.ilike.%${search}%,partner_two_name.ilike.%${search}%`,
    );
  }

  const { data: weddings, count } = await query;
  const rows = weddings ?? [];
  const total = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pageCount);
  const pageRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const ids = pageRows.length ? pageRows.map((w) => w.id) : ["00000000-0000-0000-0000-000000000000"];
  const ownerIds = Array.from(
    new Set(pageRows.map((w) => w.created_by).filter(Boolean) as string[]),
  );

  const [{ data: members }, { data: subs }, { data: entitlements }] =
    await Promise.all([
    supabase.from("wedding_members").select("wedding_id, role").in("wedding_id", ids),
      supabase
        .from("subscriptions")
        .select("wedding_id, status, current_period_end")
        .in("wedding_id", ids),
      ownerIds.length
        ? supabase
            .from("user_entitlements")
            .select("user_id, lifetime_access_granted_at")
            .in("user_id", ownerIds)
        : Promise.resolve({ data: [] as { user_id: string; lifetime_access_granted_at: string | null }[] }),
    ]);

  const memberCount = new Map<string, number>();
  for (const row of members ?? []) {
    memberCount.set(row.wedding_id, (memberCount.get(row.wedding_id) ?? 0) + 1);
  }

  const entitledUsers = new Set(
    (entitlements ?? [])
      .filter((row) => row.lifetime_access_granted_at)
      .map((row) => row.user_id),
  );

  const subByWedding = new Map(
    (subs ?? []).map((row) => [row.wedding_id, row]),
  );

  const pageHref = (next: number) =>
    `/admin/weddings?page=${next}${search ? `&q=${encodeURIComponent(search)}` : ""}`;

  const nowMs = new Date().getTime();
  const accessMap = new Map<string, { label: string; tone: "success" | "neutral" | "warning" | "muted" }>();
  for (const wedding of pageRows) {
    if (
      wedding.lifetime_access_granted_at ||
      entitledUsers.has(wedding.created_by)
    ) {
      accessMap.set(wedding.id, { label: "Lifetime", tone: "success" });
      continue;
    }
    const sub = subByWedding.get(wedding.id);
    const active =
      sub?.status === "active" &&
      Boolean(sub.current_period_end) &&
      new Date(sub.current_period_end as string).getTime() > nowMs;
    if (active) accessMap.set(wedding.id, { label: "Langganan aktif", tone: "neutral" });
    else if (openAccess) accessMap.set(wedding.id, { label: "Open access", tone: "warning" });
    else accessMap.set(wedding.id, { label: "Tanpa akses", tone: "muted" });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Weddings
        </p>
        <h1 className="mt-2 font-heading text-3xl">Daftar Wedding</h1>
        <p className="text-sm text-cocoa/60">
          {total} wedding. Status akses dihitung dari data nyata (lifetime,
          langganan, atau saklar open-access).
        </p>
      </div>

      <form action="/admin/weddings" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Cari nama pasangan…"
          className="min-w-56 flex-1 rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
        />
        <button type="submit" className="rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa">
          Cari
        </button>
        {search ? (
          <Link href="/admin/weddings" className="rounded-full border border-blush px-4 py-2.5 text-sm text-cocoa/65">
            Reset
          </Link>
        ) : null}
      </form>

      {pageRows.length === 0 ? (
        <Card>
          <p className="text-sm text-cocoa/60">Belum ada wedding yang cocok.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blush/30 text-xs uppercase text-cocoa/55">
              <tr>
                <th className="px-4 py-3">Pasangan</th>
                <th className="px-4 py-3">Tanggal nikah</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush/50">
              {pageRows.map((wedding) => {
                const access = accessMap.get(wedding.id) ?? { label: "—", tone: "muted" as const };
                return (
                  <tr key={wedding.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cocoa">
                        {wedding.partner_one_name}
                        {wedding.partner_two_name
                          ? ` & ${wedding.partner_two_name}`
                          : ""}
                      </p>
                      <p className="font-mono text-[10px] text-cocoa/40">
                        {wedding.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-cocoa/65">
                      {formatWeddingDate(wedding.wedding_date, locale) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-cocoa/80">
                      {memberCount.get(wedding.id) ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={access.tone}>{access.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cocoa/55">
        <span>Halaman {currentPage} dari {pageCount}</span>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="rounded-full border border-blush px-3 py-1.5">
              Sebelumnya
            </Link>
          ) : null}
          {currentPage < pageCount ? (
            <Link href={pageHref(currentPage + 1)} className="rounded-full border border-blush px-3 py-1.5">
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
