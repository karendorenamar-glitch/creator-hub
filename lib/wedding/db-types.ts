/**
 * Types for the wedding planner schema (supabase/wedding/*.sql).
 *
 * Kept separate from types/database.ts so the legacy Kefoo pages keep
 * compiling against their own types during the transition.
 */

export type WeddingRole = "owner" | "partner";
export type SubscriptionStatus = "inactive" | "active" | "expired" | "canceled";
export type RsvpStatus = "pending" | "attending" | "not_attending";
export type InvitationStatus = "not_sent" | "sent";
export type BookingStatus = "considering" | "contacted" | "booked" | "cancelled";
export type PaymentStatus = "diskusi" | "dp" | "lunas";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Wedding = {
  id: string;
  created_by: string;
  partner_one_name: string;
  partner_two_name: string | null;
  wedding_date: string | null;
  location: string | null;
  estimated_guest_count: number | null;
  total_budget: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WeddingMember = {
  wedding_id: string;
  user_id: string;
  role: WeddingRole;
  created_at: string;
};

export type WeddingInvite = {
  id: string;
  wedding_id: string;
  email: string;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  wedding_id: string;
  plan_code: "wedding_planner_pro";
  price_idr: number;
  billing_interval: "month";
  status: SubscriptionStatus;
  started_at: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPayment = {
  id: string;
  subscription_id: string;
  wedding_id: string;
  amount_idr: number;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: string | null;
  provider_reference: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
};

export type BudgetCategory = {
  id: string;
  wedding_id: string;
  name: string;
  planned_amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Vendor = {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  quoted_price: number | null;
  agreed_price: number | null;
  deposit_amount: number;
  amount_paid: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  pic_internal: string | null;
  booking_date: string | null;
  event_service_date: string | null;
  next_payment_due: string | null;
  contract_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorPayment = {
  id: string;
  wedding_id: string;
  vendor_id: string;
  amount: number;
  paid_on: string;
  method: string | null;
  notes: string | null;
  proof_path: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  wedding_id: string;
  category_id: string | null;
  vendor_id: string | null;
  name: string;
  amount: number;
  deposit_amount: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Guest = {
  id: string;
  wedding_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  guest_group: string | null;
  invitation_status: InvitationStatus;
  rsvp_status: RsvpStatus;
  plus_ones: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistTask = {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  stage: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InspirationItem = {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  category: string;
  link_url: string | null;
  image_url: string | null;
  image_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: boolean;
  require_subscription: boolean;
  updated_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type WeddingDatabase = {
  public: {
    Tables: {
      app_settings: Table<AppSettings>;
      weddings: Table<Wedding>;
      wedding_members: Table<WeddingMember>;
      wedding_invites: Table<WeddingInvite>;
      subscriptions: Table<Subscription>;
      subscription_payments: Table<SubscriptionPayment>;
      budget_categories: Table<BudgetCategory>;
      vendors: Table<Vendor>;
      vendor_payments: Table<VendorPayment>;
      expenses: Table<Expense>;
      guests: Table<Guest>;
      checklist_tasks: Table<ChecklistTask>;
      inspiration_items: Table<InspirationItem>;
    };
    Views: Record<string, never>;
    Functions: {
      create_wedding: {
        Args: {
          p_partner_one_name: string;
          p_partner_two_name?: string | null;
          p_wedding_date?: string | null;
          p_location?: string | null;
          p_estimated_guest_count?: number | null;
          p_total_budget?: number | null;
        };
        Returns: string;
      };
      accept_wedding_invite: {
        Args: { p_token: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
