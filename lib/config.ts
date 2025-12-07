// lib/config.ts
import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),

  // Optional configuration
  LOG_LEVEL: z
    .enum(["debug", "development", "production"])
    .optional()
    .default("development"),
  MAX_REQUESTS_PER_MINUTE: z.string().optional().default("50"),
  REQUEST_WINDOW_MS: z.string().optional().default("60000"),
  MAX_PAGES_TO_SCRAPE: z.string().optional().default("50"),
  MIN_QUALITY_SCORE: z.string().optional().default("20"),
  CHUNK_SIZE: z.string().optional().default("1000"),
  CHUNK_OVERLAP: z.string().optional().default("200"),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      LOG_LEVEL: process.env.LOG_LEVEL,
      MAX_REQUESTS_PER_MINUTE: process.env.MAX_REQUESTS_PER_MINUTE,
      REQUEST_WINDOW_MS: process.env.REQUEST_WINDOW_MS,
      MAX_PAGES_TO_SCRAPE: process.env.MAX_PAGES_TO_SCRAPE,
      MIN_QUALITY_SCORE: process.env.MIN_QUALITY_SCORE,
      CHUNK_SIZE: process.env.CHUNK_SIZE,
      CHUNK_OVERLAP: process.env.CHUNK_OVERLAP,
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
    maxPages: parseInt(env.MAX_PAGES_TO_SCRAPE || "50"),
    maxContentLength: 8000,
    chunkSize: parseInt(env.CHUNK_SIZE || "1000"),
    chunkOverlap: parseInt(env.CHUNK_OVERLAP || "200"),
    maxConcurrentRequests: 5,
    minQualityScore: parseInt(env.MIN_QUALITY_SCORE || "20"), // NEW
  },
  rateLimit: {
    maxRequestsPerMinute: parseInt(env.MAX_REQUESTS_PER_MINUTE || "50"),
    requestWindow: parseInt(env.REQUEST_WINDOW_MS || "60000"),
  },
  scraping: {
    httpTimeout: 20000, // NEW
    browserTimeout: 30000, // NEW
    pageWaitTime: 2000, // NEW
    retryAttempts: 3, // NEW
  },
} as const;

// Type exports
export type Config = typeof config;
export type OpenAIConfig = typeof config.openai;
export type SupabaseConfig = typeof config.supabase;
export type IngestionConfig = typeof config.ingestion;
export type RateLimitConfig = typeof config.rateLimit;
export type ScrapingConfig = typeof config.scraping;
