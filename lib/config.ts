// lib/config.ts
import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n");
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

// Validate on startup
const env = validateEnv();

// Configuration object with type safety
export const config = {
  openai: {
    apiKey: env.OPENAI_API_KEY,
    embeddingModel: "text-embedding-3-small" as const,
    maxTokens: 8191, // Max tokens for text-embedding-3-small
    batchSize: 100, // Number of texts to process in one batch
    maxRetries: 3, // Maximum number of retries for failed requests
    retryDelay: 1000, // Initial retry delay in ms
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    maxBatchSize: 1000, // Maximum records to insert at once
  },
  ingestion: {
    maxPages: 50, // Maximum pages to crawl per website
    maxContentLength: 8000, // Maximum characters per content section
    chunkSize: 1000, // Characters per chunk
    chunkOverlap: 200, // Overlap between chunks to preserve context
    maxConcurrentRequests: 5, // Max concurrent scraping requests
  },
  rateLimit: {
    maxRequestsPerMinute: 50, // OpenAI rate limit
    requestWindow: 60000, // 1 minute in ms
  },
} as const;

// Type exports
export type Config = typeof config;
export type OpenAIConfig = typeof config.openai;
export type SupabaseConfig = typeof config.supabase;
export type IngestionConfig = typeof config.ingestion;
