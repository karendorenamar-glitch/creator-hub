export type DebtAccountType =
  | "bank_loan"
  | "credit_card"
  | "personal_loan"
  | "installment"
  | "other";

export type DebtAccountStatus = "active" | "paid" | "closed";
export type DebtScheduleStatus = "upcoming" | "paid" | "cancelled";

export type DebtAccount = {
  id: string;
  owner_user_id: string;
  creditor_name: string;
  account_type: DebtAccountType;
  reference_label: string | null;
  original_principal: number;
  interest_fees: number;
  total_amount_due: number;
  opening_date: string;
  due_date: string | null;
  due_day: number | null;
  installment_month: number;
  installment_total_months: number;
  installment_amount: number;
  status: DebtAccountStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DebtSchedule = {
  id: string;
  owner_user_id: string;
  debt_account_id: string;
  due_date: string;
  amount_due: number;
  status: DebtScheduleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DebtPayment = {
  id: string;
  owner_user_id: string;
  debt_account_id: string;
  schedule_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  idempotency_key: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type DebtDatabase = {
  public: {
    Tables: {
      debt_allowed_users: Table<{
        user_id: string;
        note: string | null;
        created_at: string;
      }>;
      debt_accounts: Table<DebtAccount>;
      debt_schedules: Table<DebtSchedule>;
      debt_payments: Table<DebtPayment>;
    };
    Views: Record<string, never>;
    Functions: {
      is_debt_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
