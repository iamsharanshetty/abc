// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export interface WebsiteEmbedding {
  id?: number;
  website_url: string;
  page_url: string;
  content_section: string;
  embedding: number[];
  metadata?: Record<string, any>;
  created_at?: string;
}
