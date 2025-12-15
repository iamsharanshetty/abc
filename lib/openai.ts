import OpenAI from "openai";
import { config } from "./config";

// Create a singleton instance of the OpenAI client
// This prevents creating multiple instances during development hot-reloads
const globalForOpenAI = globalThis as unknown as {
    openai: OpenAI | undefined;
};

export const openai = globalForOpenAI.openai ?? new OpenAI({
    apiKey: config.openai.apiKey,
});

if (process.env.NODE_ENV !== "production") {
    globalForOpenAI.openai = openai;
}
