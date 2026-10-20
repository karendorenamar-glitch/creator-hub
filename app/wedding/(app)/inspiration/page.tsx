import { redirect } from "next/navigation";
import { InspirationManager } from "@/components/wedding/inspiration/inspiration-manager";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Inspiration" };

export default async function InspirationPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const { data } = await supabase
    .from("inspiration_items")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: photoRows } = await supabase
    .from("inspiration_photos")
    .select("id, item_id, path")
    .order("sort_order", { ascending: true });

  const items = data ?? [];
  const photos = photoRows ?? [];
  const categoriesUsed = new Set(items.map((item) => item.category)).size;

  const photosByItem: Record<string, { id: string; path: string }[]> = {};
  for (const photo of photos) {
    (photosByItem[photo.item_id] ??= []).push({
      id: photo.id,
      path: photo.path,
    });
  }

  const imagePaths = Array.from(
    new Set([
      ...items
        .map((item) => item.image_path)
        .filter((path): path is string => Boolean(path)),
      ...photos.map((photo) => photo.path),
    ]),
  );

  const imageUrls: Record<string, string> = {};
  if (imagePaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("inspiration-images")
      .createSignedUrls(imagePaths, 60 * 60);
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) {
        imageUrls[entry.path] = entry.signedUrl;
      }
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.inspiration.title}
        subtitle={copy.inspiration.subtitle}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={copy.inspiration.title}
          value={String(items.length)}
        />
        <StatCard
          label={copy.inspiration.category}
          value={String(categoriesUsed)}
          tone="champagne"
        />
      </section>

      <Card>
        <InspirationManager
          items={items}
          photosByItem={photosByItem}
          imageUrls={imageUrls}
          copy={copy}
        />
      </Card>
    </div>
  );
}
