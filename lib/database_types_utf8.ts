export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          role: string
          status: string
          settings: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          role: string
          status?: string
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          role?: string
          status?: string
          settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      website_embeddings: {
        Row: {
          content_section: string
          created_at: string
          embedding: string
          id: number
          metadata: Json
          page_url: string
          website_url: string
        }
        Insert: {
          content_section: string
          created_at?: string
          embedding: string
          id?: number
          metadata?: Json
          page_url: string
          website_url: string
        }
        Update: {
          content_section?: string
          created_at?: string
          embedding?: string
          id?: number
          metadata?: Json
          page_url?: string
          website_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
