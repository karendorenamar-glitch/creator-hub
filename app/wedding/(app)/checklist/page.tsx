import Link from "next/link";
import { redirect } from "next/navigation";
import { ChecklistBoard } from "@/components/wedding/checklist/checklist-board";
import { TaskManager } from "@/components/wedding/checklist/task-manager";
import { TimelineList } from "@/components/wedding/checklist/timeline-list";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { ensureMarriageChecklist } from "@/lib/wedding/checklists";
import { resolveMarriageTemplate } from "@/lib/wedding/marriage-templates";
import { loadCustomerCountry } from "@/lib/wedding/country";
import type { Checklist, ChecklistTask } from "@/lib/wedding/db-types";
import { daysFromToday } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Checklist & Timeline" };

export default async function ChecklistPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  // One country/state template per customer. Seeding is idempotent, so opening
  // the page repeatedly never duplicates a checklist or overwrites progress.
  const country = await loadCustomerCountry(supabase, session.userId);
  const template = resolveMarriageTemplate({
    country,
    stateCode: session.wedding.state_code ?? null,
    partnerNationality: session.wedding.partner_nationality ?? null,
  });

  // Seeding is best-effort: a permission or session problem must never make
  // the whole page fail to render.
  try {
    await ensureMarriageChecklist(supabase, session.wedding.id, template);
  } catch (error) {
    console.error("[checklist] seeding failed", error);
  }

  const [
    { data: checklistRows },
    { data: taskRows },
    { data: memberRows },
  ] = await Promise.all([
    supabase
      .from("checklists")
      .select("*")
      .eq("wedding_id", session.wedding.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("checklist_tasks")
      .select("*")
      .eq("wedding_id", session.wedding.id)
      .order("sort_order", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("wedding_members")
      .select("*")
      .eq("wedding_id", session.wedding.id)
      .order("created_at", { ascending: true }),
  ]);

  const allLists = (checklistRows ?? []) as Checklist[];
  const allTasks = (taskRows ?? []) as ChecklistTask[];

  // Only the active built-in template is shown; custom checklists are always
  // kept, and snapshots from another country stay in the database untouched.
  const lists = allLists.filter(
    (checklist) =>
      checklist.kind === "custom" || checklist.kind === template.kind,
  );
  const visibleListIds = new Set(lists.map((checklist) => checklist.id));
  const tasks = allTasks.filter(
    (task) => !task.checklist_id || visibleListIds.has(task.checklist_id),
  );
  const itemsByChecklist = new Map<string, ChecklistTask[]>();
  for (const task of tasks) {
    if (!task.checklist_id) continue;
    const bucket = itemsByChecklist.get(task.checklist_id) ?? [];
    bucket.push(task);
    itemsByChecklist.set(task.checklist_id, bucket);
  }
  const checklists = lists.map((checklist) => ({
    ...checklist,
    items: itemsByChecklist.get(checklist.id) ?? [],
  }));
  const legacyTasks = tasks.filter((task) => !task.checklist_id);
  const timelineTasks = tasks
    .filter((task) => task.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const done = tasks.filter((task) => task.status === "done").length;
  const pending = tasks.length - done;
  const overdue = tasks.filter((task) => {
    if (task.status === "done") return false;
    const days = daysFromToday(task.due_date);
    return days !== null && days < 0;
  }).length;

  const partnerTwo = session.wedding.partner_two_name?.trim();
  const assignees = (memberRows ?? []).map((member) => {
    const name =
      member.role === "owner"
        ? session.wedding.partner_one_name
        : partnerTwo || copy.checklist.unassigned;
    return {
      id: member.user_id,
      label:
        member.user_id === session.userId ? `${name} (${copy.form.you})` : name,
    };
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.checklist.title}
        subtitle={
          template.kind === "builtin_my"
            ? "A practical preparation template for your marriage registration. Requirements and application procedures may vary by state; please confirm with your local State Religious Department."
            : copy.checklist.subtitle
        }
      />

      {template.needsPartnerNationality ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900">
                {locale === "en"
                  ? "Complete your partner's nationality"
                  : "Lengkapi kewarganegaraan pasangan"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                {locale === "en"
                  ? "Please update your partner's nationality in Settings to see the correct marriage document requirements."
                  : "Perbarui kewarganegaraan pasangan di Settings untuk melihat persyaratan dokumen pernikahan yang tepat."}
              </p>
            </div>
            <Link
              href="/wedding/settings"
              className="shrink-0 rounded-xl bg-olive-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-olive-700"
            >
              {locale === "en" ? "Update Settings" : "Buka Settings"}
            </Link>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={copy.checklist.title} value={String(tasks.length)} />
        <StatCard
          label={copy.checklist.markDone}
          value={String(done)}
          tone="champagne"
        />
        <StatCard label={copy.checklist.status} value={String(pending)} />
        <StatCard label={copy.checklist.overdue} value={String(overdue)} />
      </section>

      <Card>
        <ChecklistBoard
          checklists={checklists}
          copy={copy}
          locale={locale}
        />
      </Card>

      <Card>
        <TaskManager
          tasks={legacyTasks}
          copy={copy}
          locale={locale}
          assignees={assignees}
          title={copy.checklist.otherTasks}
          subtitle={copy.checklist.otherTasksHint}
        />
      </Card>

      <TimelineList
        tasks={timelineTasks}
        checklists={lists}
        copy={copy}
        locale={locale}
      />
    </div>
  );
}
