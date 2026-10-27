import { redirect } from "next/navigation";
import { ChecklistBoard } from "@/components/wedding/checklist/checklist-board";
import { TaskManager } from "@/components/wedding/checklist/task-manager";
import { TimelineList } from "@/components/wedding/checklist/timeline-list";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { ensureKuaChecklist } from "@/lib/wedding/checklists";
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

  await ensureKuaChecklist(supabase, session.wedding.id);

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

  const lists = (checklistRows ?? []) as Checklist[];
  const tasks = (taskRows ?? []) as ChecklistTask[];
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
        subtitle={copy.checklist.subtitle}
      />

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
