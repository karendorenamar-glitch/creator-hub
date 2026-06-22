import type { DashboardWorkspaceAnalytics } from "@/lib/dashboard-analytics";
import type { PayoutTimingBadge } from "@/lib/payouts";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type Creator = {
  id: string;
  name: string;
  tiktok_username: string | null;
  instagram_username: string | null;
  threads_username: string | null;
  contact: string | null;
  notes: string | null;
  platform: string;
  followers: number;
  fee: number;
  created_at: string;
};

export type Video = {
  id: string;
  creator_id: string;
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  created_at: string;
};

export type VideoWithCreator = Video & {
  creators: Pick<Creator, "name" | "platform"> | null;
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
  campaigns: Pick<Campaign, "id" | "name" | "client_name" | "status">[];
  top_performing_video: VideoWithCreator | null;
  videos: VideoWithCreator[];
};

export type Campaign = {
  id: string;
  name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: CampaignStatus;
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

export type CampaignDetail = Campaign & {
  creators: Creator[];
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
      creators: {
        Row: Creator;
        Insert: {
          id?: string;
          name: string;
          tiktok_username?: string | null;
          instagram_username?: string | null;
          threads_username?: string | null;
          contact?: string | null;
          notes?: string | null;
          platform?: string;
          followers?: number;
          fee?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tiktok_username?: string | null;
          instagram_username?: string | null;
          threads_username?: string | null;
          contact?: string | null;
          notes?: string | null;
          platform?: string;
          followers?: number;
          fee?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          views: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
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
          name: string;
          client_name: string;
          start_date: string;
          end_date: string;
          budget?: number;
          status?: CampaignStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          client_name?: string;
          start_date?: string;
          end_date?: string;
          budget?: number;
          status?: CampaignStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_creators: {
        Row: {
          campaign_id: string;
          creator_id: string;
        };
        Insert: {
          campaign_id: string;
          creator_id: string;
        };
        Update: {
          campaign_id?: string;
          creator_id?: string;
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
