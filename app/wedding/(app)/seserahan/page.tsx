import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/wedding/action-context";
import { ItemForm } from "@/components/wedding/seserahan/item-form";
import {
  createItemAction,
  deleteItemAction,
  deletePhotoAction,
  movePhotoAction,
  toggleItemStatusAction,
  updateItemAction,
} from "./actions";

const BUCKET = "seserahan-photos";

const DEFAULT_CATEGORIES = [
  "Skincare/makeup",
  "Fashion/pakaian",
  "Tas/sepatu/aksesoris",
  "Bodycare/fragrance",
  "Ibadah",
  "Makanan",
  "Mahar",
  "Lainnya",
];

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const PARTIES = [
  { key: "bride" as const, title: "Pihak Wanita", accent: "from-rose-50 to-amber-50" },
  { key: "groom" as const, title: "Pihak Pria", accent: "from-stone-100 to-rose-50" },
];

export default async function SeserahanPage() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");

  const weddingId = ctx.session.wedding.id;
  const supabase = ctx.supabase;

  let { data: categories } = await supabase
    .from("seserahan_categories")
    .select("id, name, sort_order")
    .eq("wedding_id", weddingId)
    .order("sort_order")
    .order("name");

  if (!categories || categories.length === 0) {
    await supabase.from("seserahan_categories").insert(
      DEFAULT_CATEGORIES.map((name, index) => ({
        wedding_id: weddingId,
        name,
        sort_order: index,
      })),
    );
    const seeded = await supabase
      .from("seserahan_categories")
      .select("id, name, sort_order")
      .eq("wedding_id", weddingId)
      .order("sort_order")
      .order("name");
    categories = seeded.data ?? [];
  }

  const { data: items } = await supabase
    .from("seserahan_items")
    .select("id, party, name, brand, category_id, price, quantity, status, notes, created_at")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  const { data: photos } = await supabase
    .from("seserahan_photos")
    .select("id, item_id, path, sort_order")
    .eq("wedding_id", weddingId)
    .order("sort_order");

  const paths = (photos ?? []).map((photo) => photo.path);
  const { data: signed } =
    paths.length > 0
      ? await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60)
      : { data: [] };

  const urlByPath = new Map(
    (signed ?? []).map((entry) => [entry.path ?? "", entry.signedUrl]),
  );
  const photosByItem = new Map<string, { id: string; url: string }[]>();
  for (const photo of photos ?? []) {
    const list = photosByItem.get(photo.item_id) ?? [];
    const url = urlByPath.get(photo.path);
    if (url) list.push({ id: photo.id, url });
    photosByItem.set(photo.item_id, list);
  }

  const categoryName = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const categoryNames = (categories ?? []).map((category) => category.name);
  const allItems = items ?? [];

  const summarize = (rows: typeof allItems) => {
    const total = rows.length;
    const purchased = rows.filter((row) => row.status === "purchased").length;
    const budget = rows.reduce((sum, row) => sum + row.price * row.quantity, 0);
    const bought = rows
      .filter((row) => row.status === "purchased")
      .reduce((sum, row) => sum + row.price * row.quantity, 0);
    return { total, purchased, pending: total - purchased, budget, bought, remaining: budget - bought };
  };

  const groomItems = allItems.filter((row) => row.party === "groom");
  const brideItems = allItems.filter((row) => row.party === "bride");
  const overall = summarize(allItems);

  const summaryCard = (
    label: string,
    value: string,
    tone: "cream" | "rose" | "stone" = "cream",
  ) => (
    <div
      key={label}
      className={`rounded-2xl border border-rose-100 px-4 py-3 ${tone === "rose" ? "bg-rose-50/70" : tone === "stone" ? "bg-stone-50" : "bg-[#fdfaf5]"}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-stone-800">{value}</p>
    </div>
  );

  const partySummary = (rows: typeof allItems) => {
    const s = summarize(rows);
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCard("Total item", String(s.total))}
        {summaryCard("Sudah dibeli", String(s.purchased), "rose")}
        {summaryCard("Belum dibeli", String(s.pending), "stone")}
        {summaryCard("Total budget", rupiah.format(s.budget))}
        {summaryCard("Nilai dibeli", rupiah.format(s.bought), "rose")}
        {summaryCard("Sisa", rupiah.format(s.remaining), "stone")}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-400">Seserahan</p>
        <h1 className="font-serif text-2xl text-stone-800 sm:text-3xl">Daftar Seserahan</h1>
        <p className="text-sm text-stone-500">
          Kelola seserahan pihak pria dan wanita, lengkap dengan foto dan status pembelian.
        </p>
      </header>

      <section className="rounded-3xl border border-rose-100 bg-white/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-stone-800">Ringkasan keseluruhan</h2>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
            {overall.total} item
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {summaryCard("Total item", String(overall.total))}
          {summaryCard("Sudah dibeli", String(overall.purchased), "rose")}
          {summaryCard("Belum dibeli", String(overall.pending), "stone")}
          {summaryCard("Total budget", rupiah.format(overall.budget))}
          {summaryCard("Nilai dibeli", rupiah.format(overall.bought), "rose")}
          {summaryCard("Sisa", rupiah.format(overall.remaining), "stone")}
        </div>
      </section>

{PARTIES.map((party) => {
        const rows = party.key === "groom" ? groomItems : brideItems;
        return (
          <section key={party.key} className="space-y-4">
            <div className={`rounded-3xl border border-rose-100 bg-gradient-to-r ${party.accent} px-5 py-4`}>
              <h2 className="font-serif text-xl text-stone-800">{party.title}</h2>
              <div className="mt-3">{partySummary(rows)}</div>
            </div>

            <details className="rounded-2xl border border-rose-100 bg-white/80 p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-medium text-rose-600">
                + Tambah item {party.title.toLowerCase()}
              </summary>
              <div className="mt-4">
                <ItemForm
                  action={createItemAction}
                  party={party.key}
                  categories={categoryNames}
                  submitLabel="Simpan item"
                />
              </div>
            </details>

            {rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-rose-200 px-4 py-8 text-center text-sm text-stone-500">
                Belum ada item untuk {party.title.toLowerCase()}.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((item) => {
                  const gallery = photosByItem.get(item.id) ?? [];
                  const lineTotal = item.price * item.quantity;
                  const purchased = item.status === "purchased";
                  return (
                    <article
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-stone-800">{item.name}</h3>
                          <p className="text-[11px] text-stone-500">
                            {item.brand ? `${item.brand} · ` : ""}
                            {item.category_id ? (categoryName.get(item.category_id) ?? "Tanpa kategori") : "Tanpa kategori"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${purchased ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {purchased ? "Sudah Dibeli" : "Belum Dibeli"}
                        </span>
                      </div>

                      <p className="text-sm text-stone-700">
                        {rupiah.format(item.price)} × {item.quantity} ={" "}
                        <span className="font-semibold text-stone-900">{rupiah.format(lineTotal)}</span>
                      </p>

                      {item.notes ? (
                        <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">{item.notes}</p>
                      ) : null}

                      {gallery.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {gallery.map((photo, index) => (
                            <div key={photo.id} className="shrink-0 space-y-1">
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.url}
                                  alt={item.name}
                                  className="h-20 w-20 rounded-xl border border-rose-100 object-cover"
                                />
                                {index === 0 ? (
                                  <span className="absolute bottom-0.5 left-0.5 rounded bg-amber-400/90 px-1 text-[9px] font-semibold text-stone-800">
                                    Cover
                                  </span>
                                ) : null}
                                <form action={deletePhotoAction}>
                                  <input type="hidden" name="id" value={photo.id} />
                                  <button className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-red-600 shadow">
                                    ✕
                                  </button>
                                </form>
                              </div>
                              <div className="flex items-center gap-1">
                                <form action={movePhotoAction}>
                                  <input type="hidden" name="id" value={photo.id} />
                                  <input type="hidden" name="mode" value="left" />
                                  <button
                                    className="rounded bg-white px-1 text-[10px] text-stone-500 shadow-sm hover:text-rose-600 disabled:opacity-30"
                                    title="Geser kiri"
                                  >
                                    ◀
                                  </button>
                                </form>
                                <form action={movePhotoAction}>
                                  <input type="hidden" name="id" value={photo.id} />
                                  <input type="hidden" name="mode" value="right" />
                                  <button
                                    className="rounded bg-white px-1 text-[10px] text-stone-500 shadow-sm hover:text-rose-600"
                                    title="Geser kanan"
                                  >
                                    ▶
                                  </button>
                                </form>
                                <form action={movePhotoAction}>
                                  <input type="hidden" name="id" value={photo.id} />
                                  <input type="hidden" name="mode" value="cover" />
                                  <button
                                    className="rounded bg-white px-1 text-[10px] text-amber-500 shadow-sm hover:text-amber-600"
                                    title="Jadikan cover"
                                  >
                                    ★
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-auto flex items-center gap-2">
                        <form action={toggleItemStatusAction} className="flex-1">
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={purchased ? "not_purchased" : "purchased"}
                          />
                          <button className="w-full rounded-full border border-rose-200 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50">
                            {purchased ? "Tandai belum dibeli" : "Tandai sudah dibeli"}
                          </button>
                        </form>
                        <form action={deleteItemAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="rounded-full border border-stone-200 px-3 py-1.5 text-[11px] text-stone-500 hover:border-red-200 hover:text-red-600">
                            Hapus
                          </button>
                        </form>
                      </div>

                      <details className="rounded-xl bg-[#fdfaf5] px-3 py-2">
                        <summary className="cursor-pointer text-[11px] font-medium text-stone-600">
                          Edit item
                        </summary>
                        <div className="mt-3">
                          <ItemForm
                            action={updateItemAction}
                            party={item.party}
                            categories={categoryNames}
                            item={{
                              id: item.id,
                              party: item.party,
                              name: item.name,
                              brand: item.brand,
                              categoryName: item.category_id
                                ? (categoryName.get(item.category_id) ?? null)
                                : null,
                              quantity: item.quantity,
                              status: item.status,
                              notes: item.notes,
                            }}
                            submitLabel="Simpan perubahan"
                          />
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
