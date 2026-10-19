import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ListOrdered,
  Store,
  Users,
} from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { daysFromToday, formatIDR, formatWeddingDate, percentOf } from "@/lib/wedding/format";
import { coupleNames, isSubscriptionActive, loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = weddingCopy[locale];
  const supabase = await createWeddingClient();

  const [expensesResult, guestsResult, vendorsResult, tasksResult] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("id, name, amount, amount_paid, payment_status, due_date")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("guests").select("id, rsvp_status"),
      supabase.from("vendors").select("id, name, booking_status"),
      supabase
        .from("checklist_tasks")
        .select("id, title, status, due_date, priority")
        .order("due_date", { ascending: true, nullsFirst: false }),
    ]);

  const expenses = expensesResult.data ?? [];
  const guests = guestsResult.data ?? [];
  const vendors = vendorsResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const totalBudget = Number(session.wedding.total_budget ?? 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + Number(e.amount_paid ?? 0), 0);
  const remaining = totalBudget - totalExpenses;
  const usedPercent = percentOf(totalExpenses, totalBudget);

  const attending = guests.filter((g) => g.rsvp_status === "attending").length;
  const pendingRsvp = guests.filter((g) => g.rsvp_status === "pending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;

  const bookedVendors = vendors.filter((v) => v.booking_status === "booked").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;

  const upcomingTasks = tasks.filter((t) => t.status !== "done" && t.due_date).slice(0, 5);
  const upcomingPayments = expenses
    .filter(
      (e) =>
        e.payment_status !== "paid" &&
        e.due_date &&
        (daysFromToday(e.due_date) ?? -1) >= 0,
    )
    .slice(0, 5);

  const daysToWedding = daysFromToday(session.wedding.wedding_date);
  const weddingDateLabel = formatWeddingDate(session.wedding.wedding_date, locale);
  const isActive = isSubscriptionActive(session.subscription);

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.dashboard.title}
        subtitle={`${coupleNames(session.wedding)} · ${copy.dashboard.subtitle}`}
      />

      {!isActive ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-heading text-base font-semibold text-ink">
                {copy.dashboard.lockedTitle}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {copy.dashboard.lockedBody}
              </p>
            </div>
            <Link
              href="/wedding/billing"
              className="rounded-xl bg-blush-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blush-600"
            >
              {copy.dashboard.activate}
            </Link>
          </div>
        </Card>
      ) : null}

      {weddingDateLabel ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blush-50 via-ivory to-champagne-100/70">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-blush-500">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">
                {copy.dashboard.weddingIn}
              </p>
              <p className="font-heading text-base font-semibold text-ink">
                {weddingDateLabel}
              </p>
            </div>
          </div>
          {daysToWedding !== null ? (
            <Badge tone={daysToWedding < 30 ? "warning" : "neutral"}>
              {daysToWedding >= 0
                ? copy.dashboard.daysLeft.replace("{days}", String(daysToWedding))
                : copy.dashboard.dateTbc}
            </Badge>
          ) : null}
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={copy.dashboard.totalBudget}
          value={formatIDR(totalBudget)}
          icon={<CalendarDays className="size-4" aria-hidden />}
        />
        <StatCard
          label={copy.dashboard.spent}
          value={formatIDR(totalExpenses)}
          hint={`${formatIDR(totalPaid)} ${copy.dashboard.paid.toLowerCase()}`}
          tone="champagne"
          icon={<CheckCircle2 className="size-4" aria-hidden />}
        />
        <StatCard
          label={copy.dashboard.remaining}
          value={formatIDR(remaining)}
          hint={totalBudget > 0 ? undefined : copy.dashboard.emptyBudget}
          icon={<Clock className="size-4" aria-hidden />}
        />
        <Card className="flex flex-col justify-between gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.dashboard.percentSpent}
            </p>
            <span className="rounded-full bg-blush-50 p-2 text-blush-600">
              <ListOrdered className="size-4" aria-hidden />
            </span>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              {usedPercent}%
            </p>
            <div className="mt-2">
              <Progress value={usedPercent} />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.dashboard.guestsInvited}
            </p>
            <Users className="size-4 text-blush-400" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {guests.length}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="success">
              {copy.dashboard.attending} {attending}
            </Badge>
            <Badge tone="warning">
              {copy.dashboard.pending} {pendingRsvp}
            </Badge>
            <Badge tone="muted">
              {copy.dashboard.notAttending} {notAttending}
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.dashboard.vendorsBooked}
            </p>
            <Store className="size-4 text-blush-400" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {bookedVendors}
            <span className="ml-1 text-base font-normal text-ink-soft">
              / {vendors.length}
            </span>
          </p>
          <div className="mt-3">
            <Progress value={percentOf(bookedVendors, vendors.length)} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.dashboard.tasksDone}
            </p>
            <CheckCircle2 className="size-4 text-blush-400" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {doneTasks}
            <span className="ml-1 text-base font-normal text-ink-soft">
              / {tasks.length}
            </span>
          </p>
          <div className="mt-3">
            <Progress value={percentOf(doneTasks, tasks.length)} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-heading text-base font-semibold text-ink">
            {copy.dashboard.upcoming}
          </h2>
          <div className="mt-4">
            {upcomingTasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-6 text-center text-sm text-ink-soft">
                {copy.dashboard.noTasks}
              </p>
            ) : (
              <ul className="divide-y divide-blush-100">
                {upcomingTasks.map((task) => {
                  const days = daysFromToday(task.due_date);
                  return (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="min-w-0 truncate text-sm text-ink">
                        {task.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                        {formatWeddingDate(task.due_date, locale)}
                        {days !== null ? (
                          <Badge tone={days < 0 ? "warning" : "muted"}>
                            {Math.abs(days)}d
                          </Badge>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-base font-semibold text-ink">
            {copy.dashboard.upcomingPayments}
          </h2>
          <div className="mt-4">
            {upcomingPayments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-6 text-center text-sm text-ink-soft">
                {copy.dashboard.noUpcoming}
              </p>
            ) : (
              <ul className="divide-y divide-blush-100">
                {upcomingPayments.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm text-ink">
                      {expense.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-ink-soft">
                      {formatWeddingDate(expense.due_date, locale)}
                      <span className="font-medium text-ink">
                        {formatIDR(Number(expense.amount ?? 0))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      {guests.length === 0 && vendors.length === 0 && tasks.length === 0 ? (
        <EmptyState
          title={copy.dashboard.setupTitle}
          body={copy.dashboard.setupBody}
          icon={<ListOrdered className="size-6" aria-hidden />}
        />
      ) : null}
    </div>
  );
}
