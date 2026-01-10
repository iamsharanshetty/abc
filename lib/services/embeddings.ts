// lib/services/embeddings.ts - UPDATED FOR FIXED SQL FUNCTION
// ✅ IMPORTANT: This matches the SQL function with p_website_url parameter

import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =====================================================
// CONFIGURATION
// =====================================================
const EMBEDDING_CONFIG = {
  model: "text-embedding-3-small",
  dimensions: 1536,
  batchSize: 100,
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },
  search: {
    defaultThreshold: 0.2, // ✅ Lowered from 0.25
    minThreshold: 0.1, // ✅ Lowered from 0.15
    maxThreshold: 0.8,
    adaptiveThreshold: true,
    hybridSearch: true,
    keywordWeight: 0.3,
  },
};

// =====================================================
// TYPES
// =====================================================
interface SearchResult {
  id: number;
  website_url: string;
  page_url: string;
  content_section: string;
  similarity: number;
  metadata: any;
  match_type: "semantic" | "keyword" | "hybrid";
}

interface SearchOptions {
  threshold?: number;
  matchCount?: number;
  hybridSearch?: boolean;
  adaptiveThreshold?: boolean;
}

// =====================================================
// EMBEDDING CACHE
// =====================================================
const embeddingCache = new Map<
  string,
  { embedding: number[]; timestamp: number }
>();

function getCacheKey(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function getCachedEmbedding(text: string): number[] | null {
  if (!EMBEDDING_CONFIG.cache.enabled) return null;
  const key = getCacheKey(text);
  const cached = embeddingCache.get(key);

  if (cached && Date.now() - cached.timestamp < EMBEDDING_CONFIG.cache.ttl) {
    return cached.embedding;
  }

  if (cached) embeddingCache.delete(key);
  return null;
}

function setCachedEmbedding(text: string, embedding: number[]): void {
  if (!EMBEDDING_CONFIG.cache.enabled) return;

  const key = getCacheKey(text);
  embeddingCache.set(key, { embedding, timestamp: Date.now() });

  // Clean old cache
  if (embeddingCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of embeddingCache.entries()) {
      if (now - v.timestamp > EMBEDDING_CONFIG.cache.ttl) {
        embeddingCache.delete(k);
      }
    }
  }
}

// =====================================================
// URL NORMALIZATION
// =====================================================
function normalizeUrl(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const variations = new Set<string>();

    variations.add(url);

    const withSlash = url.endsWith("/") ? url : `${url}/`;
    const withoutSlash = url.endsWith("/") ? url.slice(0, -1) : url;
    variations.add(withSlash);
    variations.add(withoutSlash);

    variations.add(urlObj.origin);
    variations.add(`${urlObj.origin}/`);

    if (urlObj.hostname.startsWith("www.")) {
      const withoutWww = url.replace("www.", "");
      variations.add(withoutWww);
      variations.add(withoutWww.endsWith("/") ? withoutWww : `${withoutWww}/`);
    } else {
      const withWww = url.replace("://", "://www.");
      variations.add(withWww);
      variations.add(withWww.endsWith("/") ? withWww : `${withWww}/`);
    }

    return Array.from(variations);
  } catch (error) {
    return [url];
  }
}

// =====================================================
// QUERY ENHANCEMENT
// =====================================================
function enhanceQuery(query: string, websiteUrl: string): string {
  const urlObj = new URL(websiteUrl);
  const domain = urlObj.hostname.replace("www.", "");
  const siteName = domain.split(".")[0];

  if (query.toLowerCase().includes(siteName.toLowerCase())) {
    return query;
  }

  return `${query} [Context: ${siteName} website]`;
}

// =====================================================
// KEYWORD EXTRACTION
// =====================================================
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
    "what",
    "where",
    "when",
    "who",
    "how",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 10);
}

// =====================================================
// CORE FUNCTIONS
// =====================================================
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const cached = getCachedEmbedding(text);
    if (cached) return cached;

    const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 8000);
    if (!cleanText) throw new Error("Empty text");

    const response = await openai.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: cleanText,
      dimensions: EMBEDDING_CONFIG.dimensions,
    });

    const embedding = response.data[0].embedding;
    setCachedEmbedding(text, embedding);

    return embedding;
  } catch (error: any) {
    console.error("❌ Embedding error:", error.message);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
    const batch = texts.slice(i, i + EMBEDDING_CONFIG.batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    embeddings.push(...batchResults);
  }

  return embeddings;
}

// =====================================================
// SEMANTIC SEARCH
// ✅ UPDATED: Uses correct parameter name p_website_url
// =====================================================
async function semanticSearch(
  queryEmbedding: number[],
  websiteUrls: string[],
  threshold: number,
  matchCount: number
): Promise<SearchResult[]> {
  const supabase = createServiceClient();
  const allResults: SearchResult[] = [];

  for (const url of websiteUrls) {
    const { data, error } = await (supabase.rpc as any)(
      "match_website_embeddings",
      {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: matchCount * 2,
        p_website_url: url,
      }
    );

    if (error) {
      console.warn(`⚠️  RPC error for ${url}:`, error);
      continue;
    }

    if (data && data.length > 0) {
      allResults.push(
        ...data.map((d: any) => ({ ...d, match_type: "semantic" as const }))
      );
    }
  }

  const uniqueResults = Array.from(
    new Map(allResults.map((item) => [item.id, item])).values()
  ).sort((a, b) => b.similarity - a.similarity);

  return uniqueResults.slice(0, matchCount);
}

// =====================================================
// KEYWORD SEARCH
// =====================================================
async function keywordSearch(
  query: string,
  websiteUrls: string[],
  matchCount: number
): Promise<SearchResult[]> {
  const supabase = createServiceClient();
  const keywords = extractKeywords(query);

  if (keywords.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from("website_embeddings")
      .select("*")
      .in("website_url", websiteUrls)
      .or(
        keywords
          .map((keyword) => `content_section.ilike.%${keyword}%`)
          .join(",")
      )
      .limit(matchCount);

    if (error) return [];

    return (data || []).map((item) => ({
      id: item.id,
      website_url: item.website_url,
      page_url: item.page_url,
      content_section: item.content_section,
      similarity: 0.5,
      metadata: item.metadata,
      match_type: "keyword" as const,
    }));
  } catch (error) {
    console.error("❌ Keyword search error:", error);
    return [];
  }
}

// Add this class to lib/services/embeddings.ts

export class EmbeddingService {
  async deleteWebsiteEmbeddings(
    websiteUrl: string,
    supabase: any
  ): Promise<void> {
    const urlVariations = normalizeUrl(websiteUrl);

    const { error } = await supabase
      .from("website_embeddings")
      .delete()
      .in("website_url", urlVariations);

    if (error) {
      throw new Error(`Failed to delete embeddings: ${error.message}`);
    }

    console.log(`🗑️ Deleted embeddings for ${websiteUrl}`);
  }

  async storeEmbeddings(
    websiteUrl: string,
    pageUrl: string,
    content: string,
    metadata: any,
    supabase: any
  ): Promise<{ chunksSaved: number }> {
    // Split content into chunks (approx 1000 chars each)
    const chunks = this.splitIntoChunks(content, 1000);

    // Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks);

    // Prepare records for insertion
    const records = chunks.map((chunk, index) => ({
      website_url: websiteUrl,
      page_url: pageUrl,
      content_section: chunk,
      embedding: embeddings[index],
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }));

    // Insert into database
    const { error } = await supabase.from("website_embeddings").insert(records);

    if (error) {
      throw new Error(`Failed to store embeddings: ${error.message}`);
    }

    return { chunksSaved: records.length };
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((chunk) => chunk.length > 50);
  }

  async getEmbeddingStats(
    websiteUrl: string,
    supabase: any
  ): Promise<{
    totalChunks: number;
    uniquePages: number;
    avgSimilarity?: number;
    sampleEmbeddings?: any[];
  }> {
    const urlVariations = normalizeUrl(websiteUrl);

    // Get total count and sample embeddings
    const { data, error, count } = await supabase
      .from("website_embeddings")
      .select("id, page_url, content_section, metadata", { count: "exact" })
      .in("website_url", urlVariations)
      .limit(5);

    if (error) {
      throw new Error(`Failed to get embedding stats: ${error.message}`);
    }

    const uniquePages = new Set(data?.map((d: any) => d.page_url) || []).size;

    return {
      totalChunks: count || 0,
      uniquePages,
      sampleEmbeddings: data || [],
    };
  }

  async testEmbeddingSearch(
    websiteUrl: string,
    query: string,
    supabase: any
  ): Promise<{
    success: boolean;
    query: string;
    resultsFound: number;
    topResults: any[];
    topScores: number[];
    avgSimilarity: number;
  }> {
    try {
      // Use the existing searchSimilarContent function
      const results = await searchSimilarContent(query, websiteUrl, {
        matchCount: 5,
        threshold: 0.1,
      });

      const topScores = results.map((r) => r.similarity);
      const avgSimilarity =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length
          : 0;

      return {
        success: true,
        query,
        resultsFound: results.length,
        topResults: results.slice(0, 3).map((r) => ({
          page_url: r.page_url,
          similarity: r.similarity,
          match_type: r.match_type,
          content_preview: r.content_section.substring(0, 200) + "...",
        })),
        topScores,
        avgSimilarity,
      };
    } catch (error) {
      console.error("Test search error:", error);
      return {
        success: false,
        query,
        resultsFound: 0,
        topResults: [],
        topScores: [],
        avgSimilarity: 0,
      };
    }
  }
}

// =====================================================
// MAIN SEARCH FUNCTION
// =====================================================
export async function searchSimilarContent(
  query: string,
  websiteUrl: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    threshold = EMBEDDING_CONFIG.search.defaultThreshold,
    matchCount = 5,
    hybridSearch = EMBEDDING_CONFIG.search.hybridSearch,
    adaptiveThreshold = EMBEDDING_CONFIG.search.adaptiveThreshold,
  } = options;

  console.log("🔍 Search start:", {
    query: query.substring(0, 50),
    websiteUrl,
    threshold,
  });

  try {
    const urlVariations = normalizeUrl(websiteUrl);
    const enhancedQuery = enhanceQuery(query, websiteUrl);
    const queryEmbedding = await generateEmbedding(enhancedQuery);

    let semanticResults: SearchResult[] = [];
    let keywordResults: SearchResult[] = [];

    // Adaptive threshold
    let currentThreshold = threshold;
    let attempts = 0;

    while (semanticResults.length === 0 && attempts < 3) {
      semanticResults = await semanticSearch(
        queryEmbedding,
        urlVariations,
        currentThreshold,
        matchCount
      );

      if (semanticResults.length === 0 && adaptiveThreshold) {
        currentThreshold = Math.max(
          currentThreshold - 0.05,
          EMBEDDING_CONFIG.search.minThreshold
        );
        attempts++;
        console.log(`🔄 Lowering threshold to ${currentThreshold}`);
      } else {
        break;
      }
    }

    // Keyword search
    if (hybridSearch) {
      keywordResults = await keywordSearch(query, urlVariations, matchCount);
    }

    // Merge results
    const resultMap = new Map<number, SearchResult>();

    for (const result of [...semanticResults, ...keywordResults]) {
      const existing = resultMap.get(result.id);

      if (!existing) {
        resultMap.set(result.id, result);
      } else {
        const hybridScore =
          existing.similarity * (1 - EMBEDDING_CONFIG.search.keywordWeight) +
          result.similarity * EMBEDDING_CONFIG.search.keywordWeight;

        resultMap.set(result.id, {
          ...existing,
          similarity: Math.max(existing.similarity, hybridScore),
          match_type: "hybrid",
        });
      }
    }

    const finalResults = Array.from(resultMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount);

    console.log("✅ Search complete:", {
      semantic: semanticResults.length,
      keyword: keywordResults.length,
      final: finalResults.length,
      topScore: finalResults[0]?.similarity,
    });

    return finalResults;
  } catch (error: any) {
    console.error("❌ Search error:", error.message);
    throw error;
  }
}

export async function getWebsiteEmbeddingsStats(websiteUrl: string) {
  const supabase = createServiceClient();
  const urlVariations = normalizeUrl(websiteUrl);

  const { data, error } = await supabase
    .from("website_embeddings")
    .select("id, page_url", { count: "exact" })
    .in("website_url", urlVariations);

  if (error) return null;

  return {
    totalChunks: data?.length || 0,
    uniquePages: new Set(data?.map((d) => d.page_url)).size,
  };
}
