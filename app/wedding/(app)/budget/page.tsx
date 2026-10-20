import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/wedding/budget/category-manager";
import { ExpenseManager } from "@/components/wedding/budget/expense-manager";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatIDR, percentOf } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Budget & Expenses" };

export default async function BudgetPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const [categoriesResult, expensesResult, vendorsResult] = await Promise.all([
    supabase
      .from("budget_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("expenses")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("vendors").select("id, name").order("name", { ascending: true }),
  ]);

  const categories = categoriesResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const vendors = vendorsResult.data ?? [];

  const totalBudget = Number(session.wedding.total_budget ?? 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalPaid = expenses.reduce(
    (sum, item) => sum + Number(item.amount_paid),
    0,
  );
  const remaining = totalBudget - totalExpenses;
  const usedPercent = percentOf(totalExpenses, totalBudget);
  const plannedTotal = categories.reduce(
    (sum, category) => sum + Number(category.planned_amount),
    0,
  );

  const actualByCategory: Record<string, number> = {};
  for (const expense of expenses) {
    if (!expense.category_id) continue;
    actualByCategory[expense.category_id] =
      (actualByCategory[expense.category_id] ?? 0) + Number(expense.amount);
  }

  return (
    <div className="space-y-7">
      <PageHeader title={copy.budget.title} subtitle={copy.budget.subtitle} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={copy.budget.totalBudget} value={formatIDR(totalBudget)} />
        <StatCard
          label={copy.budget.spent}
          value={formatIDR(totalExpenses)}
          tone="champagne"
        />
        <StatCard label={copy.budget.paid} value={formatIDR(totalPaid)} />
        <StatCard
          label={copy.budget.remaining}
          value={formatIDR(remaining)}
          hint={
            remaining < 0
              ? copy.budget.overBudget
              : `${copy.budget.planned}: ${formatIDR(plannedTotal)}`
          }
        />
      </section>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
            {copy.budget.usage}
          </p>
          <p className="text-sm font-semibold text-ink">{usedPercent}%</p>
        </div>
        <Progress value={usedPercent} />
        <TotalBudgetForm copy={copy} totalBudget={totalBudget} />
      </Card>

      <Card>
        <CategoryManager
          categories={categories}
          actualByCategory={actualByCategory}
          copy={copy}
        />
      </Card>

      <Card>
        <ExpenseManager
          expenses={expenses}
          categories={categories}
          vendors={vendors}
          copy={copy}
          locale={locale}
        />
      </Card>
    </div>
  );
}
