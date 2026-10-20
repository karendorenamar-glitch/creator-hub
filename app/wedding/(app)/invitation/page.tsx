import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  deleteRsvpAction,
  publishInvitationFormAction,
  setInvitationTemplateAction,
} from "@/app/wedding/(app)/invitation/actions";
import { INVITATION_TEMPLATES } from "@/lib/wedding/invitation-templates";
import { CopyLinkButton } from "@/components/wedding/invitation/copy-link-button";
import { InvitationEditor } from "@/components/wedding/invitation/invitation-editor";
import { DeleteForm } from "@/components/wedding/delete-form";
import { Badge, Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatDateTime } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { E_INVITATION_ENABLED } from "@/lib/wedding/features";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "E-Invitation" };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default async function InvitationPage() {
  if (!E_INVITATION_ENABLED) notFound();

  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const [{ data: invitation }, { data: rsvpRows }] = await Promise.all([
    supabase
      .from("invitations")
      .select("*")
      .eq("wedding_id", session.wedding.id)
      .maybeSingle(),
    supabase
      .from("invitation_rsvps")
      .select("*")
      .eq("wedding_id", session.wedding.id)
      .order("created_at", { ascending: false }),
  ]);

  const rsvps = rsvpRows ?? [];
  const attending = rsvps.filter((rsvp) => rsvp.attendance === "attending");
  const totalGuests = attending.reduce((sum, rsvp) => sum + rsvp.guests, 0);

  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const publicUrl = invitation ? `${protocol}://${host}/i/${invitation.slug}` : "";

  const defaultSlug =
    slugify(
      `${session.wedding.partner_one_name}-${session.wedding.partner_two_name ?? ""}`,
    ) || "undangan-kami";

  const isPublished = invitation?.status === "published";

  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/invitation-photos`;
  const coverUrl = invitation?.cover_path
    ? `${storageBase}/${invitation.cover_path}`
    : null;
  const coupleUrl = invitation?.couple_path
    ? `${storageBase}/${invitation.couple_path}`
    : null;

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.invitation.title}
        subtitle={copy.invitation.subtitle}
      />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone={isPublished ? "success" : "muted"}>
              {isPublished ? copy.invitation.published : copy.invitation.draft}
            </Badge>
            {invitation?.published_at ? (
              <span className="text-xs text-ink-soft">
                {formatDateTime(invitation.published_at, locale)}
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-ink">
            {publicUrl || `${protocol}://${host}/i/${defaultSlug}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invitation ? <CopyLinkButton url={publicUrl} copy={copy} /> : null}
          {isPublished && invitation ? (
            <Link
              href={`/i/${invitation.slug}`}
              target="_blank"
              className="rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
            >
              {copy.invitation.preview}
            </Link>
          ) : null}
          <form action={publishInvitationFormAction}>
            <input
              type="hidden"
              name="publish"
              value={isPublished ? "false" : "true"}
            />
            <button
              type="submit"
              disabled={!invitation}
              className="rounded-xl border border-olive-200 bg-white px-4 py-2.5 text-sm font-medium text-olive-700 hover:bg-olive-50 disabled:opacity-50"
            >
              {isPublished
                ? copy.invitation.unpublish
                : copy.invitation.publish}
            </button>
          </form>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.invitation.templateTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {INVITATION_TEMPLATES.map((template) => {
            const selected = invitation?.template === template.key;
            return (
              <form key={template.key} action={setInvitationTemplateAction}>
                <input type="hidden" name="template" value={template.key} />
                <button
                  type="submit"
                  className={`w-full overflow-hidden rounded-2xl border text-left transition-colors ${
                    selected
                      ? "border-olive-500 ring-2 ring-olive-200"
                      : "border-olive-100 hover:border-olive-300"
                  }`}
                >
                  <span className={`block h-20 ${template.swatch}`} />
                  <span className="block space-y-1 bg-white p-3">
                    <span className="block text-sm font-medium text-ink">
                      {template.name}
                    </span>
                    <span className="block text-xs leading-relaxed text-ink-soft">
                      {template.description}
                    </span>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                        selected
                          ? "bg-olive-100 text-olive-700"
                          : "bg-olive-50 text-ink-soft"
                      }`}
                    >
                      {selected
                        ? copy.invitation.currentTemplate
                        : copy.invitation.useTemplate}
                    </span>
                  </span>
                </button>
              </form>
            );
          })}
        </div>
        {!invitation ? (
          <p className="text-xs text-ink-soft">
            Pilih desain untuk membuat undangan draf otomatis.
          </p>
        ) : null}
      </Card>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={copy.invitation.responses}
          value={String(rsvps.length)}
        />
        <StatCard
          label={copy.invitation.attending}
          value={String(attending.length)}
          tone="champagne"
        />
        <StatCard
          label={copy.invitation.totalGuests}
          value={String(totalGuests)}
        />
      </section>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold text-ink">
          {copy.invitation.title}
        </h2>
        <InvitationEditor
          copy={copy}
          invitation={invitation ?? null}
          defaultSlug={defaultSlug}
          coverUrl={coverUrl}
          coupleUrl={coupleUrl}
        />
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold text-ink">
          {copy.invitation.responses}
        </h2>
        {rsvps.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
            {copy.invitation.noResponses}
          </p>
        ) : (
          <ul className="divide-y divide-olive-100">
            {rsvps.map((rsvp) => (
              <li
                key={rsvp.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {rsvp.name}
                    <span className="ml-2 text-xs font-normal text-ink-soft">
                      {rsvp.guests} {copy.invitation.guests.toLowerCase()}
                    </span>
                  </p>
                  {rsvp.message ? (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {rsvp.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={rsvp.attendance === "attending" ? "success" : "muted"}
                  >
                    {rsvp.attendance === "attending"
                      ? copy.invitation.attending
                      : copy.invitation.notAttending}
                  </Badge>
                  <DeleteForm
                    action={deleteRsvpAction}
                    id={rsvp.id}
                    copy={copy}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

    </div>
  );
}
