// lib/openai.ts
<<<<<<< HEAD
=======
//  WARNING: ONLY import this file in server-side code!
// This file uses config.server.ts which contains secrets

>>>>>>> chat-backup
import OpenAI from "openai";
import { serverConfig } from "./config.server"; //  Import server config (has API key)
import { config } from "./config"; // Import client config (for settings)

<<<<<<< HEAD
// Declare global type for OpenAI instance caching
declare global {
  var openaiInstance: OpenAI | undefined;
}

/**
 * Get or create OpenAI client instance (singleton pattern)
 * Uses global caching to prevent multiple instances during hot reload
 */
function getOpenAIClient(): OpenAI {
  if (!global.openaiInstance) {
    global.openaiInstance = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return global.openaiInstance;
}

// Export the singleton instance
export const openai = getOpenAIClient();

// Export types for convenience
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};
=======
//  STEP 1: Create OpenAI client using the API key from server config
export const openai = new OpenAI({
  apiKey: serverConfig.openai.apiKey, //  API key from server config
  timeout: 60000, // 60 seconds
  maxRetries: config.openai.maxRetries, //  Settings from client config
});

//  STEP 2: Export a helper function to check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!serverConfig.openai.apiKey;
}

//  STEP 3: Safety check - make sure we're on the server
if (typeof window !== "undefined") {
  throw new Error(
    " SECURITY ERROR: lib/openai.ts was imported in client-side code!\n" +
      "This file should ONLY be imported in:\n" +
      "- API routes (app/api/*/route.ts)\n" +
      "- Server Actions (files with 'use server')\n" +
      "- Server Components (no 'use client' directive)\n" +
      "- Service files (lib/services/*)"
  );
}

console.log(" OpenAI client initialized successfully");

//  IMPORTANT NOTES:
// 1. This file imports config.server.ts, so it can ONLY be used server-side
// 2. Never import this in any file that has 'use client' directive
// 3. Never import this in any component inside the components/ folder
// 4. Safe to use in: API routes, server actions, and lib/services/ files
>>>>>>> chat-backup
