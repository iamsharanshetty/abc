// lib/supabase/service.ts
// Service role client for server-side operations that bypass RLS
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/**
 * Creates a Supabase client with the service role key.
 * This client bypasses Row Level Security (RLS) policies.
 *
 * ⚠️ WARNING: Only use this for:
 * - Public access (like chat widget embed)
 * - Admin operations that need to bypass RLS
 * - Background jobs
 *
 * DO NOT use this for user-facing operations where RLS should apply!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Export type for convenience
export type ServiceClient = ReturnType<typeof createServiceClient>;
