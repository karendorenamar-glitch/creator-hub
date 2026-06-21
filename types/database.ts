export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type Creator = {
  id: string;
  name: string;
  username: string | null;
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
  campaigns: Pick<Campaign, "id" | "name" | "brand_name" | "status">[];
  top_performing_video: VideoWithCreator | null;
  videos: VideoWithCreator[];
};

export type Campaign = {
  id: string;
  name: string;
  brand_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: CampaignStatus;
  created_at: string;
};

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

export type DashboardStats = {
  totalCampaigns: number;
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
};

export type Database = {
  public: {
    Tables: {
      creators: {
        Row: Creator;
        Insert: {
          id?: string;
          name: string;
          username?: string | null;
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
          username?: string | null;
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
          brand_name: string;
          start_date: string;
          end_date: string;
          budget?: number;
          status?: CampaignStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand_name?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
