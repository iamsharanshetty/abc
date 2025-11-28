// lib/config.ts
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    embeddingModel: "text-embedding-3-small",
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },
  ingestion: {
    maxPages: 50, // Maximum pages to crawl per website
    maxContentLength: 8000, // Maximum characters per content section
  },
};
