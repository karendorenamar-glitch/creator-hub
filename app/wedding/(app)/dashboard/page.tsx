import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ListOrdered,
  Store,
  Users,
} from "lucide-react";
import {
  Badge,
  Card,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { daysFromToday, formatIDR, formatWeddingDate, percentOf } from "@/lib/wedding/format";
import { coupleNames, loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = weddingCopy[locale];
  const moduleText = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const [guestsResult, vendorsResult, tasksResult, paymentsResult] =
    await Promise.all([
      supabase.from("guests").select("id, rsvp_status"),
      supabase
        .from("vendors")
        .select("id, name, booking_status, agreed_price, quoted_price"),
      supabase
        .from("checklist_tasks")
        .select("id, title, status, due_date, priority")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("vendor_payments")
        .select("id, vendor_id, amount, paid_on")
        .order("paid_on", { ascending: false }),
    ]);

  const guests = guestsResult.data ?? [];
  const vendors = vendorsResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const payments = paymentsResult.data ?? [];

  const totalBudget = Number(session.wedding.total_budget ?? 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const remaining = totalBudget - totalPaid;
  const usedPercent = percentOf(totalPaid, totalBudget);

  const attending = guests.filter((g) => g.rsvp_status === "attending").length;
  const pendingRsvp = guests.filter((g) => g.rsvp_status === "pending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;

  const bookedVendors = vendors.filter((v) => v.booking_status === "booked").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;

  const upcomingTasks = tasks.filter((t) => t.status !== "done" && t.due_date).slice(0, 5);

  const paidByVendor = new Map<string, number>();
  for (const payment of payments) {
    paidByVendor.set(
      payment.vendor_id,
      (paidByVendor.get(payment.vendor_id) ?? 0) + Number(payment.amount ?? 0),
    );
  }

  const outstandingVendors = vendors
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name?.trim() || moduleText.vendors.unnamed,
      remaining: Math.max(
        0,
        Number(vendor.agreed_price ?? vendor.quoted_price ?? 0) -
          (paidByVendor.get(vendor.id) ?? 0),
      ),
    }))
    .filter((vendor) => vendor.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 5);

  const daysToWedding = daysFromToday(session.wedding.wedding_date);
  const weddingDateLabel = formatWeddingDate(session.wedding.wedding_date, locale);

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.dashboard.title}
        subtitle={`${coupleNames(session.wedding)} · ${copy.dashboard.subtitle}`}
      />

      {weddingDateLabel ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-olive-50 via-cream to-sand-100/70">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-olive-600">
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
          value={formatIDR(totalPaid)}
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
            <span className="rounded-full bg-olive-50 p-2 text-olive-700">
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
            <Users className="size-4 text-olive-400" aria-hidden />
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
            <Store className="size-4 text-olive-400" aria-hidden />
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
            <CheckCircle2 className="size-4 text-olive-400" aria-hidden />
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
              <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-6 text-center text-sm text-ink-soft">
                {copy.dashboard.noTasks}
              </p>
            ) : (
              <ul className="divide-y divide-olive-100">
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
            {copy.dashboard.outstanding}
          </h2>
          <div className="mt-4">
            {outstandingVendors.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-6 text-center text-sm text-ink-soft">
                {copy.dashboard.noUpcoming}
              </p>
            ) : (
              <ul className="divide-y divide-olive-100">
                {outstandingVendors.map((vendor) => (
                  <li
                    key={vendor.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm text-ink">
                      {vendor.name}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-ink">
                      {formatIDR(vendor.remaining)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      {guests.length === 0 && vendors.length === 0 && tasks.length === 0 ? (
        <Card className="bg-gradient-to-br from-white via-cream to-olive-50">
          <h2 className="font-heading text-lg font-semibold text-ink">
            {copy.dashboard.setupTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {copy.dashboard.setupBody}
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { href: "/wedding/settings", label: copy.dashboard.setupStep1 },
              { href: "/wedding/guests", label: copy.dashboard.setupStep2 },
              { href: "/wedding/vendors", label: copy.dashboard.setupStep3 },
              { href: "/wedding/checklist", label: copy.dashboard.setupStep4 },
            ].map((step, index) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 rounded-2xl border border-olive-100 bg-white/70 px-4 py-3 transition-colors hover:border-olive-200 hover:bg-olive-50"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-olive-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">
                    {step.label}
                  </span>
                  <ChevronRight className="size-4 text-ink-soft" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </div>
  );
}
