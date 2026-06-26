import type { DashboardWorkspaceAnalytics } from "@/lib/dashboard-analytics";
import type { PayoutTimingBadge } from "@/lib/payouts";
import type { OrgAddOnRecord, OrgAddOnStatus, OrgAddOnType } from "@/lib/plan-add-ons";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type CampaignType = "bulk" | "personal";

export type CampaignCreatorWorkflowStatus =
  | "brief_sent"
  | "waiting_content"
  | "revision"
  | "posted";

export type OrgMemberRole = "leader" | "team";

export type OrgPlan = "free_trial" | "starter" | "growth" | "scale";

export type { OrgAddOnRecord, OrgAddOnStatus, OrgAddOnType };

export type Organization = {
  id: string;
  name: string;
  slug: string | null;
  plan: OrgPlan;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  member_limit: number | null;
  created_at: string;
};

export type OrgInvite = {
  id: string;
  org_id: string;
  email: string;
  role: OrgMemberRole;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type PaymentSubmissionStatus = "pending" | "approved" | "rejected";

export type PaymentSubmission = {
  id: string;
  org_id: string;
  plan: Extract<OrgPlan, "starter" | "growth" | "scale">;
  amount_idr: number;
  payment_date: string;
  subscription_ends_at: string | null;
  sender_name: string | null;
  notes: string | null;
  proof_url: string;
  status: PaymentSubmissionStatus;
  created_at: string;
  reviewed_at: string | null;
};

export type PlanCheckoutView = {
  id: string;
  org_id: string;
  plan: Extract<OrgPlan, "starter" | "growth" | "scale">;
  created_at: string;
};

export type OrgMember = {
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
};

export type Creator = {
  id: string;
  org_id: string;
  name: string;
  tiktok_username: string | null;
  instagram_username: string | null;
  threads_username: string | null;
  contact: string | null;
  notes: string | null;
  platform: string;
  followers: number;
  fee: number;
  created_by: string | null;
  created_at: string;
};

export type CreatorListItem = Creator & {
  campaigns: Pick<Campaign, "id" | "name">[];
};

export type Video = {
  id: string;
  org_id: string;
  creator_id: string;
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  created_by: string | null;
  created_at: string;
};

export type VideoWithCreator = Video & {
  creators: Pick<Creator, "name" | "platform"> | null;
};

export type CreatorCampaignDetail = Pick<
  Campaign,
  "id" | "name" | "client_name" | "status"
> & {
  videos: VideoWithCreator[];
};

export type CreatorDetail = Creator & {
  total_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  average_engagement_rate: number;
  cpv: number;
  cpl: number;
  campaigns: CreatorCampaignDetail[];
  top_performing_video: VideoWithCreator | null;
  videos: VideoWithCreator[];
};

export type Campaign = {
  id: string;
  org_id: string;
  name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: CampaignStatus;
  campaign_type: CampaignType;
  created_by: string | null;
  created_at: string;
};

export type CampaignSummary = Campaign & {
  creator_count: number;
  video_count: number;
};

export type CampaignOption = Pick<Campaign, "id" | "name">;

export type CampaignListItem = Campaign & {
  creator_count: number;
  video_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  engagement_rate: number;
  cpv: number;
  top_creator: {
    name: string;
    platform: string;
    total_views: number;
  } | null;
  best_engagement_creator: {
    name: string;
    platform: string;
    engagement_rate: number;
  } | null;
  most_efficient_creator: {
    name: string;
    platform: string;
    cpv: number;
  } | null;
};

export type CampaignCreator = Creator & {
  campaign_fee: number | null;
  workflow_status: CampaignCreatorWorkflowStatus | null;
};

export type CampaignDetail = Campaign & {
  creators: CampaignCreator[];
  videos: VideoWithCreator[];
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  engagement_rate: number;
  cpv: number;
  cpe: number;
  top_creator: {
    name: string;
    platform: string;
    total_views: number;
  } | null;
  best_engagement_creator: {
    name: string;
    platform: string;
    engagement_rate: number;
  } | null;
  most_efficient_creator: {
    name: string;
    platform: string;
    cpv: number;
  } | null;
  most_valuable_content: {
    title: string;
    creator_name: string;
    platform: string;
    metric_value: string;
    metric_label: string;
  } | null;
  best_engagement_content: {
    title: string;
    creator_name: string;
    platform: string;
    metric_value: string;
    metric_label: string;
  } | null;
};

export type DashboardStats = {
  activeCampaigns: number;
  totalBudget: number;
  totalCampaignViews: number;
  averageEngagementRate: number;
  costPerView: number;
  topCreator: {
    name: string;
    platform: string;
    totalViews: number;
  } | null;
  highestErCreator: {
    name: string;
    platform: string;
    engagementRate: number;
  } | null;
  mostEfficientCreator: {
    name: string;
    platform: string;
    cpv: number;
  } | null;
  workspace: DashboardWorkspaceAnalytics;
};

export type ContentPlannerAgency = {
  id: string;
  org_id: string;
  user_id: string;
  content_pillar: string;
  content_idea: string;
  hook: string;
  creator_names: string[] | null;
  campaign_id: string | null;
  planned_date: string | null;
  inspiration_url: string | null;
  platform: string;
  status: string;
  created_at: string;
};

export type PayoutStatus = "PENDING" | "PAID" | "CANCELLED";

export type Payout = {
  id: string;
  org_id: string;
  creator_id: string;
  campaign_id: string | null;
  amount: number;
  status: PayoutStatus;
  requested_at: string;
  due_date: string;
  payment_term_days: number;
  notes: string;
  proof_url: string | null;
  created_at: string;
  creators: Pick<Creator, "name"> | null;
  campaigns: Pick<Campaign, "name"> | null;
};

export type PayoutWithTiming = Payout & {
  daysLeft: number | null;
  isOverdue: boolean;
  timingBadge: PayoutTimingBadge | null;
  timingLabel: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          plan?: OrgPlan;
          trial_ends_at?: string | null;
          member_limit?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          plan?: OrgPlan;
          trial_ends_at?: string | null;
          member_limit?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      org_members: {
        Row: OrgMember;
        Insert: {
          org_id: string;
          user_id: string;
          role?: OrgMemberRole;
          created_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          role?: OrgMemberRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      org_invites: {
        Row: OrgInvite;
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: OrgMemberRole;
          token?: string;
          invited_by: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: OrgMemberRole;
          token?: string;
          invited_by?: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      org_add_ons: {
        Row: OrgAddOnRecord;
        Insert: {
          id?: string;
          org_id: string;
          add_on_type: OrgAddOnType;
          quantity?: number;
          status?: OrgAddOnStatus;
          notes?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          add_on_type?: OrgAddOnType;
          quantity?: number;
          status?: OrgAddOnStatus;
          notes?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "org_add_ons_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_submissions: {
        Row: PaymentSubmission;
        Insert: {
          id?: string;
          org_id: string;
          plan: PaymentSubmission["plan"];
          amount_idr: number;
          payment_date: string;
          subscription_ends_at?: string | null;
          sender_name?: string | null;
          notes?: string | null;
          proof_url: string;
          status?: PaymentSubmissionStatus;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          plan?: PaymentSubmission["plan"];
          amount_idr?: number;
          payment_date?: string;
          subscription_ends_at?: string | null;
          sender_name?: string | null;
          notes?: string | null;
          proof_url?: string;
          status?: PaymentSubmissionStatus;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_submissions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_checkout_views: {
        Row: PlanCheckoutView;
        Insert: {
          id?: string;
          org_id: string;
          plan: PlanCheckoutView["plan"];
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          plan?: PlanCheckoutView["plan"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_checkout_views_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      creators: {
        Row: Creator;
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          tiktok_username?: string | null;
          instagram_username?: string | null;
          threads_username?: string | null;
          contact?: string | null;
          notes?: string | null;
          platform?: string;
          followers?: number;
          fee?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          tiktok_username?: string | null;
          instagram_username?: string | null;
          threads_username?: string | null;
          contact?: string | null;
          notes?: string | null;
          platform?: string;
          followers?: number;
          fee?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          org_id: string;
          creator_id: string;
          title: string;
          views: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          creator_id: string;
          title: string;
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          creator_id?: string;
          title?: string;
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: Campaign;
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          client_name: string;
          start_date: string;
          end_date: string;
          budget?: number;
          status?: CampaignStatus;
          campaign_type?: CampaignType;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          client_name?: string;
          start_date?: string;
          end_date?: string;
          budget?: number;
          status?: CampaignStatus;
          campaign_type?: CampaignType;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_creators: {
        Row: {
          campaign_id: string;
          creator_id: string;
          fee: number | null;
          workflow_status: CampaignCreatorWorkflowStatus | null;
        };
        Insert: {
          campaign_id: string;
          creator_id: string;
          fee?: number | null;
          workflow_status?: CampaignCreatorWorkflowStatus | null;
        };
        Update: {
          campaign_id?: string;
          creator_id?: string;
          fee?: number | null;
          workflow_status?: CampaignCreatorWorkflowStatus | null;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_creators_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_videos: {
        Row: {
          campaign_id: string;
          video_id: string;
        };
        Insert: {
          campaign_id: string;
          video_id: string;
        };
        Update: {
          campaign_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_videos_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_videos_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      content_planner_agency: {
        Row: ContentPlannerAgency;
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          content_pillar?: string;
          content_idea?: string;
          hook?: string;
          creator_names?: string[] | null;
          campaign_id?: string | null;
          planned_date?: string | null;
          inspiration_url?: string | null;
          platform?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          content_pillar?: string;
          content_idea?: string;
          hook?: string;
          creator_names?: string[] | null;
          campaign_id?: string | null;
          planned_date?: string | null;
          inspiration_url?: string | null;
          platform?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: Omit<Payout, "creators" | "campaigns">;
        Insert: {
          id?: string;
          org_id: string;
          creator_id: string;
          campaign_id?: string | null;
          amount?: number;
          status?: PayoutStatus;
          requested_at?: string;
          due_date: string;
          payment_term_days?: number;
          notes?: string;
          proof_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          creator_id?: string;
          campaign_id?: string | null;
          amount?: number;
          status?: PayoutStatus;
          requested_at?: string;
          due_date?: string;
          payment_term_days?: number;
          notes?: string;
          proof_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payouts_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization_for_user: {
        Args: {
          org_name: string;
          org_slug: string;
          org_plan?: string;
          org_trial_ends_at?: string;
        };
        Returns: {
          id: string;
          name: string;
          slug: string | null;
          plan: OrgPlan;
          trial_ends_at: string | null;
          created_at: string;
        }[];
      };
      get_org_team_members: {
        Args: {
          p_org_id: string;
        };
        Returns: {
          user_id: string;
          role: string;
          email: string;
          full_name: string;
          joined_at: string;
        }[];
      };
      invite_org_member: {
        Args: {
          p_org_id: string;
          p_email: string;
          p_role?: string;
        };
        Returns: {
          invite_id: string | null;
          invite_token: string | null;
          added_directly: boolean;
        }[];
      };
      accept_org_invite: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
      remove_org_member: {
        Args: {
          p_org_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      cancel_org_invite: {
        Args: {
          p_invite_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
