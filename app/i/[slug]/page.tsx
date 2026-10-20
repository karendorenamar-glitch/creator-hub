import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationTemplate } from "@/components/wedding/invitation/invitation-template";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function loadInvitation(slug: string) {
  const supabase = await createWeddingClient();
  const { data } = await supabase.rpc("get_public_invitation", {
    p_slug: slug,
  });
  return data?.[0] ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const row = await loadInvitation(slug).catch(() => null);
  if (!row) return { title: "Undangan" };

  const title = `${row.partner_one_name} & ${row.partner_two_name ?? ""}`.trim();
  return { title, description: `Undangan pernikahan ${title}` };
}

export default async function PublicInvitationPage({ params }: Params) {
  const { slug } = await params;
  const row = await loadInvitation(slug);
  if (!row) notFound();

  const locale = await getLocale();
  const copy = moduleCopy[locale];

  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/invitation-photos`;

  return (
    <div className="wedding-app">
      <InvitationTemplate
        data={{
          id: row.id,
          slug,
          template: row.template,
          content: row.content ?? {},
          coverUrl: row.cover_path ? `${storageBase}/${row.cover_path}` : null,
          coupleUrl: row.couple_path ? `${storageBase}/${row.couple_path}` : null,
          partner_one_name: row.partner_one_name,
          partner_two_name: row.partner_two_name,
          wedding_date: row.wedding_date,
          location: row.location,
        }}
        copy={copy}
        locale={locale}
      />
    </div>
  );
}
