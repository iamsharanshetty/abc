// lib/database.types.ts - FIXED VERSION with Complete Agents Schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          name: string;
          website_url: string;
          role: string;
          status: string;
          system_prompt: string | null;
          settings: Json;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          name: string;
          website_url: string;
          role: string;
          status?: string;
          system_prompt?: string | null;
          settings?: Json;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          name?: string;
          website_url?: string;
          role?: string;
          status?: string;
          system_prompt?: string | null;
          settings?: Json;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          company: string | null;
          website: string | null;
          domain_occupation: string | null;
          project_idea: string | null;
          referral_source: string | null;
          onboarding_completed: boolean;
          onboarding_answers: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          website?: string | null;
          domain_occupation?: string | null;
          project_idea?: string | null;
          referral_source?: string | null;
          onboarding_completed?: boolean;
          onboarding_answers?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          website?: string | null;
          domain_occupation?: string | null;
          project_idea?: string | null;
          referral_source?: string | null;
          onboarding_completed?: boolean;
          onboarding_answers?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_embeddings: {
        Row: {
          content_section: string;
          created_at: string;
          embedding: string;
          id: number;
          metadata: Json;
          page_url: string;
          website_url: string;
        };
        Insert: {
          content_section: string;
          created_at?: string;
          embedding: string;
          id?: number;
          metadata?: Json;
          page_url: string;
          website_url: string;
        };
        Update: {
          content_section?: string;
          created_at?: string;
          embedding?: string;
          id?: number;
          metadata?: Json;
          page_url?: string;
          website_url?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          agent_id: string;
          user_message: string;
          assistant_response: string;
          created_at: string;
          metadata: Json;
          feedback_rating: number | null;
          feedback_comment: string | null;
          feedback_submitted_at: string | null;
        };
        Insert: {
          id: string;
          agent_id: string;
          user_message: string;
          assistant_response: string;
          created_at?: string;
          metadata?: Json;
          feedback_rating?: number | null;
          feedback_comment?: string | null;
          feedback_submitted_at?: string | null;
        };
        Update: {
          id?: string;
          agent_id?: string;
          user_message?: string;
          assistant_response?: string;
          created_at?: string;
          metadata?: Json;
          feedback_rating?: number | null;
          feedback_comment?: string | null;
          feedback_submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          }
        ];
      };
      leads: {
        Row: {
          id: string;
          agent_id: string;
          conversation_id: string | null;
          name: string | null;
          email: string | null;
          phone: string | null;
          company: string | null;
          interest: string | null;
          captured_at: string;
          status: string;
          metadata: Json;
          sent_to_webhook: boolean;
          webhook_sent_at: string | null;
          email_sent: boolean;
          email_sent_at: string | null;
          crm_synced: boolean;
          crm_sync_id: string | null;
          crm_synced_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          conversation_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          interest?: string | null;
          captured_at?: string;
          status?: string;
          metadata?: Json;
          sent_to_webhook?: boolean;
          webhook_sent_at?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          crm_synced?: boolean;
          crm_sync_id?: string | null;
          crm_synced_at?: string | null;
        };
        Update: {
          id?: string;
          agent_id?: string;
          conversation_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          interest?: string | null;
          captured_at?: string;
          status?: string;
          metadata?: Json;
          sent_to_webhook?: boolean;
          webhook_sent_at?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          crm_synced?: boolean;
          crm_sync_id?: string | null;
          crm_synced_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          session_id: string | null;
          user_id: string | null;
          agent_id: string | null;
          website_url: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          session_id?: string | null;
          user_id?: string | null;
          agent_id?: string | null;
          website_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          session_id?: string | null;
          user_id?: string | null;
          agent_id?: string | null;
          website_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_website_content: {
        Args: {
          query_embedding: string;
          match_threshold: number;
          match_count: number;
          website_url_filter: string;
        };
        Returns: {
          id: number;
          content_section: string;
          page_url: string;
          similarity: number;
        }[];
      };
      get_conversations_by_day: {
        Args: {
          p_agent_id: string;
          p_start_date: string;
        };
        Returns: {
          date: string;
          count: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
