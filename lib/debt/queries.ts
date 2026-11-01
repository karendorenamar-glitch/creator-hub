import type {
  DebtAccount,
  DebtPayment,
  DebtSchedule,
} from "./db-types";
import type { DebtDatabase } from "./db-types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DebtData = {
  accounts: DebtAccount[];
  payments: DebtPayment[];
  schedules: DebtSchedule[];
};

/**
 * Loads the owner's ledger through RLS. Every query is also filtered by owner
 * so an accidental policy regression does not turn into cross-owner reads.
 */

export async function loadDebtData(
  supabase: SupabaseClient<DebtDatabase>,
  ownerId: string,
): Promise<DebtData> {
  const [accounts, payments, schedules] = await Promise.all([
    supabase
      .from("debt_accounts")
      .select("*")
      .eq("owner_user_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("debt_payments")
      .select("*")
      .eq("owner_user_id", ownerId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("debt_schedules")
      .select("*")
      .eq("owner_user_id", ownerId)
      .order("due_date", { ascending: true }),
  ]);

  if (accounts.error || payments.error || schedules.error) {
    throw new Error("Debt data could not be loaded.");
  }

  return {
    accounts: (accounts.data ?? []).map((account) => ({
      ...account,
      original_principal: Number(account.original_principal),
      interest_fees: Number(account.interest_fees),
      total_amount_due: Number(account.total_amount_due),
      installment_month: Number(account.installment_month ?? 0),
      installment_total_months: Number(
        account.installment_total_months ?? 0,
      ),
      installment_amount: Number(account.installment_amount ?? 0),
      due_day:
        account.due_day === null || account.due_day === undefined
          ? null
          : Number(account.due_day),
    })) as DebtAccount[],
    payments: (payments.data ?? []).map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })) as DebtPayment[],
    schedules: (schedules.data ?? []).map((schedule) => ({
      ...schedule,
      amount_due: Number(schedule.amount_due),
    })) as DebtSchedule[],
  };
}
