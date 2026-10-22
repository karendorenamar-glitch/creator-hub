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
  lifetime_access_granted_at?: string | null;
  lifetime_access_payment_id?: string | null;
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

export type UserEntitlement = {
  user_id: string;
  lifetime_access_granted_at: string | null;
  source_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessPaymentStatus = "awaiting_payment" | "pending_review" | "approved" | "rejected";

export type Payment = {
  id: string;
  reference: string;
  user_id: string;
  wedding_id: string;
  amount_idr: number;
  currency: "IDR";
  method: "bank_transfer";
  status: AccessPaymentStatus;
  sender_name: string;
  receipt_path: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  email_status: "pending" | "sent" | "failed";
  email_attempts: number;
  email_last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type InvitationPublishStatus = "draft" | "published";

export type InvitationContent = {
  tagline?: string | null;
  story?: string | null;
  ceremonyTime?: string | null;
  ceremonyPlace?: string | null;
  receptionTime?: string | null;
  receptionPlace?: string | null;
  venueAddress?: string | null;
  mapsUrl?: string | null;
  dressCode?: string | null;
  closingMessage?: string | null;
  coverImageUrl?: string | null;
  coupleImageUrl?: string | null;
  musicUrl?: string | null;
};

export type InvitationTemplateKey = "elegant" | "garden" | "luxury";

export type InvitationDesign = {
  palette?: "olive" | "gold" | "blush";
  font?: "fraunces" | "playfair" | "cormorant";
  coverLayout?: "centered" | "split" | "frame";
  sections?: {
    story?: boolean;
    ceremony?: boolean;
    reception?: boolean;
    venue?: boolean;
    dressCode?: boolean;
    rsvp?: boolean;
  };
};

export type Invitation = {
  id: string;
  wedding_id: string;
  slug: string;
  status: InvitationPublishStatus;
  template: InvitationTemplateKey;
  content: InvitationContent;
  design: InvitationDesign;
  music_mode: "none" | "library" | "upload";
  music_track_id: string | null;
  music_path: string | null;
  music_volume: number;
  cover_path: string | null;
  couple_path: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MusicTrack = {
  id: string;
  title: string;
  mood: string;
  duration_seconds: number | null;
  license: string;
  license_url: string | null;
  audio_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type InvitationRsvp = {
  id: string;
  invitation_id: string;
  wedding_id: string;
  name: string;
  attendance: "attending" | "not_attending";
  guests: number;
  message: string | null;
  created_at: string;
};

export type InspirationPhoto = {
  id: string;
  wedding_id: string;
  item_id: string;
  path: string;
  sort_order: number;
  created_at: string;
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
      inspiration_photos: Table<InspirationPhoto>;
      invitations: Table<Invitation>;
      invitation_rsvps: Table<InvitationRsvp>;
      music_tracks: Table<MusicTrack>;
      payments: Table<Payment>;
      user_entitlements: Table<UserEntitlement>;
    };
    Views: Record<string, never>;
    Functions: {
      get_public_invitation: {
        Args: { p_slug: string };
        Returns: {
          id: string;
          wedding_id: string;
          content: InvitationContent;
          design: InvitationDesign;
          template: InvitationTemplateKey;
          music_mode: "none" | "library" | "upload";
          music_track_id: string | null;
          music_path: string | null;
          music_volume: number;
          cover_path: string | null;
          couple_path: string | null;
          published_at: string | null;
          partner_one_name: string;
          partner_two_name: string | null;
          wedding_date: string | null;
          location: string | null;
        }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      approve_payment: {
        Args: { p_payment_id: string };
        Returns: undefined;
      };
      reject_payment: {
        Args: { p_payment_id: string; p_reason?: string | null };
        Returns: undefined;
      };
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
