// lib/supabase/helpers.ts
// ✅ Type-safe helper functions for Supabase queries
import { Database } from "../database.types";

// Extract table types for easy reference
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Commonly used types
export type AgentRow = Tables<"agents">;
export type ConversationRow = Tables<"conversations">;
export type LeadRow = Tables<"leads">;
export type WebsiteEmbeddingRow = Tables<"website_embeddings">;
export type AnalyticsEventRow = Tables<"analytics_events">;

export type AgentInsert = TablesInsert<"agents">;
export type ConversationInsert = TablesInsert<"conversations">;
export type LeadInsert = TablesInsert<"leads">;
export type WebsiteEmbeddingInsert = TablesInsert<"website_embeddings">;
export type AnalyticsEventInsert = TablesInsert<"analytics_events">;

export type AgentUpdate = TablesUpdate<"agents">;
export type ConversationUpdate = TablesUpdate<"conversations">;
export type LeadUpdate = TablesUpdate<"leads">;
export type WebsiteEmbeddingUpdate = TablesUpdate<"website_embeddings">;
export type AnalyticsEventUpdate = TablesUpdate<"analytics_events">;

// RPC function types
export type MatchWebsiteContentArgs =
  Database["public"]["Functions"]["match_website_content"]["Args"];
export type MatchWebsiteContentReturns =
  Database["public"]["Functions"]["match_website_content"]["Returns"];
export type GetConversationsByDayArgs =
  Database["public"]["Functions"]["get_conversations_by_day"]["Args"];
export type GetConversationsByDayReturns =
  Database["public"]["Functions"]["get_conversations_by_day"]["Returns"];
