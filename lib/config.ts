// lib/config.ts
import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      OPENAI_API_KEY: process.env.ALENTA_OPENAI_KEY || process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    maxTokens: 8191,
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000,
  },
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    maxBatchSize: 1000,
  },
  ingestion: {
    maxPages: 50,
    maxContentLength: 8000,
    chunkSize: 1000,
    chunkOverlap: 200,
    maxConcurrentRequests: 5,
  },
  rateLimit: {
    maxRequestsPerMinute: 50,
    requestWindow: 60000,
  },
} as const;

// Type exports
export type Config = typeof config;
export type OpenAIConfig = typeof config.openai;
export type SupabaseConfig = typeof config.supabase;
export type IngestionConfig = typeof config.ingestion;
