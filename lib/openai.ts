// lib/openai.ts
import OpenAI from "openai";
import { config } from "./config";

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
