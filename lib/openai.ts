// lib/openai.ts
import OpenAI from "openai";
import { config } from "./config";

// Create OpenAI client instance
export const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

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
