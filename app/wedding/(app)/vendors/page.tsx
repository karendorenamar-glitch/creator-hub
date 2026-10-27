import { redirect } from "next/navigation";
import { VendorOptionsBoard } from "@/components/wedding/vendors/vendor-options-board";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Opsi Vendor" };

export default async function VendorsPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  // Migration 027 is intentionally manual. If it is not present yet, show a
  // clear setup message instead of crashing the page.
  const { data, error } = await supabase
    .from("vendor_options")
    .select("*")
    .eq("wedding_id", session.wedding.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <VendorOptionsBoard
      options={error ? [] : (data ?? [])}
      copy={copy}
      schemaReady={!error}
    />
  );
}
