// lib/config.server.ts
// ⚠️ WARNING: ONLY import this file in server-side code!
// ✅ Safe to use in: API routes, Server Actions, Server Components
// ❌ NEVER use in: Client Components (files with 'use client')

import { z } from "zod";

// Step 1: Define what environment variables we need
const serverEnvSchema = z.object({
  // OpenAI API Key (required)
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),

  // Supabase Service Role Key (optional - only for admin operations)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Redis URL (optional - for rate limiting in production)
  REDIS_URL: z.string().optional(),
});

// Step 2: Validate and load environment variables
function validateServerEnv() {
  try {
    const result = serverEnvSchema.safeParse({
      // Check both possible OpenAI key names
      OPENAI_API_KEY:
        process.env.ALENTA_OPENAI_KEY || process.env.OPENAI_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      REDIS_URL: process.env.REDIS_URL,
    });

    if (!result.success) {
      console.error("❌ Server environment validation failed:");
      console.error(result.error.format());
      throw new Error(
        "🚨 Missing required server environment variables!\n" +
          "Please check your .env.local file and make sure you have:\n" +
          "- OPENAI_API_KEY or ALENTA_OPENAI_KEY"
      );
    }

    return result.data;
  } catch (error) {
    console.error("❌ Failed to validate server environment:", error);
    throw error;
  }
}

// Step 3: Load and validate environment variables when this file is imported
const serverEnv = validateServerEnv();

// Step 4: Export the server configuration
export const serverConfig = {
  openai: {
    apiKey: serverEnv.OPENAI_API_KEY,
  },
  supabase: {
    serviceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  },
  redis: {
    url: serverEnv.REDIS_URL,
  },
} as const;

// Step 5: Helper function to check if we're on the server
export function isServerSide(): boolean {
  return typeof window === "undefined";
}

// Step 6: Safety check - throw error if accidentally imported on client
if (typeof window !== "undefined") {
  throw new Error(
    "🚨 SECURITY ERROR: config.server.ts was imported in client-side code!\n" +
      "This file contains secrets and should ONLY be imported in:\n" +
      "- API routes (app/api/*/route.ts)\n" +
      "- Server Actions (files with 'use server')\n" +
      "- Server Components (no 'use client' directive)\n" +
      "Please use 'lib/config.ts' instead for client-side code."
  );
}

console.log("✅ Server config loaded successfully");
