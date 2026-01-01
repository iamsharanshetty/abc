// lib/config.ts
// ✅ SAFE: This file can be imported anywhere (client or server)
// ❌ DO NOT add any secrets here!

import { z } from "zod";

const envSchema = z.object({
  // ✅ REMOVED: OPENAI_API_KEY - moved to config.server.ts

  // Public Supabase credentials (safe to expose)
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

function validateEnv() {
  try {
    return envSchema.parse({
      // ✅ REMOVED: OPENAI_API_KEY validation
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

const env = validateEnv();

export const config = {
  // ✅ OpenAI settings (non-secret)
  // ❌ NO API KEY HERE - it's in config.server.ts
  openai: {
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
    minQualityScore: parseInt(env.MIN_QUALITY_SCORE || "20"),
  },

  rateLimit: {
    maxRequestsPerMinute: parseInt(env.MAX_REQUESTS_PER_MINUTE || "50"),
    requestWindow: parseInt(env.REQUEST_WINDOW_MS || "60000"),
  },

  scraping: {
    httpTimeout: 20000,
    browserTimeout: 30000,
    pageWaitTime: 2000,
    retryAttempts: 3,
  },

  intentDetection: {
    strongKeywords: [
      "buy now",
      "purchase now",
      "sign me up",
      "place an order",
      "ready to buy",
      "checkout",
      "add to cart",
      "subscribe now",
      "get started now",
    ],
    moderateKeywords: [
      "buy",
      "purchase",
      "demo",
      "quote",
      "pricing",
      "price",
      "cost",
      "trial",
      "interested",
      "contact",
      "schedule",
      "book",
      "sign up",
      "register",
    ],
    negativeKeywords: [
      "don't want",
      "not interested",
      "no thanks",
      "cancel",
      "unsubscribe",
      "not now",
      "maybe later",
      "just browsing",
      "just looking",
    ],
    cacheTTL: 60 * 60 * 1000,
    maxCacheSize: 1000,
  },
} as const;

export type Config = typeof config;
export type OpenAIConfig = typeof config.openai;
export type SupabaseConfig = typeof config.supabase;
export type IngestionConfig = typeof config.ingestion;
export type RateLimitConfig = typeof config.rateLimit;
export type ScrapingConfig = typeof config.scraping;
export type IntentDetectionConfig = typeof config.intentDetection;
