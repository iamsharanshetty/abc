// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Define strict types for metadata
export interface EmbeddingMetadata {
  title?: string;
  scrapedAt: string;
  contentLength?: number;
  chunkIndex?: number;
  totalChunks?: number;
}

// Define the database row type (what's stored in the database)
export interface WebsiteEmbeddingRow {
  id: number;
  website_url: string;
  page_url: string;
  content_section: string;
  embedding: number[];
  metadata: EmbeddingMetadata | null;
  created_at: string;
}

// Define the insert type (what we send to the database)
export interface WebsiteEmbeddingInsert {
  website_url: string;
  page_url: string;
  content_section: string;
  embedding: number[];
  metadata?: EmbeddingMetadata;
}

// For backward compatibility with existing code
export type WebsiteEmbedding = WebsiteEmbeddingInsert;

// Database schema type
export type Database = {
  public: {
    Tables: {
      website_embeddings: {
        Row: WebsiteEmbeddingRow;
        Insert: WebsiteEmbeddingInsert;
        Update: Partial<WebsiteEmbeddingInsert>;
      };
    };
  };
};

// Create and validate Supabase client
function createSupabaseClient() {
  try {
    const client = createClient<Database>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          persistSession: false, // We don't need session persistence for backend
        },
        global: {
          headers: {
            "x-application-name": "webrep-backend",
          },
        },
      }
    );

    return client;
  } catch (error) {
    throw new Error(
      `Failed to create Supabase client: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Create the client
export const supabase = createSupabaseClient();

// Validate connection on startup (optional but recommended)
export async function validateConnection(): Promise<boolean> {
  try {
    // Try a simple query to validate connection
    const { error } = await supabase
      .from("website_embeddings")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase connection validation failed:", error);
      return false;
    }

    console.log("✓ Supabase connection validated successfully");
    return true;
  } catch (error) {
    console.error(
      "Failed to validate Supabase connection:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return false;
  }
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): never {
  const message = error?.message || "Unknown Supabase error";
  const details = error?.details || "";
  const hint = error?.hint || "";

  throw new Error(
    `Supabase error: ${message}${details ? ` - ${details}` : ""}${
      hint ? ` (Hint: ${hint})` : ""
    }`
  );
}
