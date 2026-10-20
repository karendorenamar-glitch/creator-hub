import { redirect } from "next/navigation";
import { TaskManager } from "@/components/wedding/checklist/task-manager";
import { SubscriptionNotice } from "@/components/wedding/subscription-notice";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { daysFromToday } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Checklist & Timeline" };

export default async function ChecklistPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const { data } = await supabase
    .from("checklist_tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  const tasks = data ?? [];
  const done = tasks.filter((task) => task.status === "done").length;
  const pending = tasks.length - done;
  const overdue = tasks.filter((task) => {
    if (task.status === "done") return false;
    const days = daysFromToday(task.due_date);
    return days !== null && days < 0;
  }).length;

  const partnerTwo = session.wedding.partner_two_name?.trim();
  const assignees = session.members.map((member) => {
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

      <SubscriptionNotice
        active={session.hasPlanningAccess}
        copy={copy}
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
        <TaskManager
          tasks={tasks}
          copy={copy}
          locale={locale}
          assignees={assignees}
        />
      </Card>
    </div>
  );
}
