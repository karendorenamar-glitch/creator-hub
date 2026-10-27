import { redirect } from "next/navigation";
import { InspirationManager } from "@/components/wedding/inspiration/inspiration-manager";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Wedding Inspiration" };

export default async function InspirationPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  // These reads are independent; run them together so the page does not pay
  // three sequential Supabase round trips before rendering.
  const [itemsResult, photosResult] = await Promise.all([
    supabase
      .from("inspiration_items")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("inspiration_photos")
      .select("id, item_id, path")
      .order("sort_order", { ascending: true }),
  ]);

  const items = itemsResult.data ?? [];
  const photos = photosResult.data ?? [];

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
    <InspirationManager
      items={items}
      photosByItem={photosByItem}
      imageUrls={imageUrls}
      copy={copy}
    />
  );
}
