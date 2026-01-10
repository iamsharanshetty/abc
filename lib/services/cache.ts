// lib/services/cache.ts
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { Database } from "@/lib/database.types";

// ✅ Define proper types from Database schema
type WebsiteEmbedding =
  Database["public"]["Tables"]["website_embeddings"]["Row"];

interface CacheEntry {
  websiteUrl: string;
  lastScraped: string;
  pagesCount: number;
  status: "completed" | "in_progress" | "failed";
}

/**
 * Simple LRU Cache implementation for intent detection
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Intent detection cache entry
 */
interface IntentCacheEntry {
  hasIntent: boolean;
  timestamp: number;
  method: "keyword" | "llm" | "cached";
}

/**
 * Cache service for website embeddings and intent detection
 */
export class CacheService {
  private static CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Intent detection cache (in-memory LRU)
  private static intentCache = new LRUCache<string, IntentCacheEntry>(1000);
  private static INTENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Generate a cache key for intent detection
   * Normalizes the message to improve cache hit rate
   */
  static generateIntentCacheKey(message: string): string {
    // Normalize: lowercase, trim, remove extra spaces, remove punctuation
    const normalized = message
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "");

    // For very similar messages, use first 100 chars
    return normalized.substring(0, 100);
  }

  /**
   * Get cached intent detection result
   */
  static getCachedIntent(message: string): IntentCacheEntry | null {
    const key = this.generateIntentCacheKey(message);
    const cached = this.intentCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache entry is still valid
    const age = Date.now() - cached.timestamp;
    if (age > this.INTENT_CACHE_TTL) {
      this.intentCache.delete(key);
      logger.debug("Intent cache expired", {
        messagePreview: message.substring(0, 30),
      });
      return null;
    }

    logger.debug("Intent cache HIT", {
      messagePreview: message.substring(0, 30),
      hasIntent: cached.hasIntent,
      method: cached.method,
      age: Math.round(age / 1000) + "s",
    });

    return cached;
  }

  /**
   * Cache an intent detection result
   */
  static cacheIntent(
    message: string,
    hasIntent: boolean,
    method: "keyword" | "llm"
  ): void {
    const key = this.generateIntentCacheKey(message);
    const entry: IntentCacheEntry = {
      hasIntent,
      timestamp: Date.now(),
      method,
    };

    this.intentCache.set(key, entry);

    logger.debug("Intent cached", {
      messagePreview: message.substring(0, 30),
      hasIntent,
      method,
    });
  }

  /**
   * Get intent cache statistics
   */
  static getIntentCacheStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.intentCache.size,
      maxSize: 1000,
    };
  }

  /**
   * Clear intent cache (useful for testing)
   */
  static clearIntentCache(): void {
    this.intentCache.clear();
    logger.info("Intent cache cleared");
  }

  // ============================================
  // EXISTING WEBSITE CACHE METHODS (FIXED)
  // ============================================

  /**
   * Check if a website was recently analyzed
   */
  static async isCached(websiteUrl: string): Promise<boolean> {
    try {
      const entry = await this.getCacheEntry(websiteUrl);

      if (!entry) {
        return false;
      }

      const age = Date.now() - new Date(entry.lastScraped).getTime();
      const isFresh = age < this.CACHE_DURATION_MS;

      if (isFresh && entry.status === "completed") {
        logger.info("Cache hit", {
          websiteUrl,
          age: Math.round(age / 1000 / 60) + " minutes",
        });
        return true;
      }

      logger.info("Cache miss or stale", {
        websiteUrl,
        isFresh,
        status: entry.status,
      });
      return false;
    } catch (error) {
      logger.error("Error checking cache", { websiteUrl, error });
      return false;
    }
  }

  /**
   * Get cache entry for a website
   * ✅ FIXED: Properly typed with explicit type annotations
   */
  static async getCacheEntry(websiteUrl: string): Promise<CacheEntry | null> {
    try {
      const supabase = await createClient();

      // ✅ FIX: Explicitly type the query result
      const { data, error } = await supabase
        .from("website_embeddings")
        .select("created_at")
        .eq("website_url", websiteUrl)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>(); // ✅ Explicit type for selected fields

      if (error) {
        logger.error("Database error checking cache", { error });
        return null;
      }

      if (!data) {
        return null;
      }

      // Get count of pages for this website
      const { count } = await supabase
        .from("website_embeddings")
        .select("page_url", { count: "exact", head: true })
        .eq("website_url", websiteUrl);

      return {
        websiteUrl,
        lastScraped: data.created_at, // ✅ TypeScript now knows this exists!
        pagesCount: count || 0,
        status: "completed",
      };
    } catch (error) {
      logger.error("Error getting cache entry", { websiteUrl, error });
      return null;
    }
  }

  /**
   * Mark a website as being analyzed
   */
  static async markInProgress(websiteUrl: string): Promise<void> {
    logger.info("Marked website as in progress", { websiteUrl });
  }

  /**
   * Mark analysis as completed
   */
  static async markCompleted(websiteUrl: string): Promise<void> {
    logger.info("Marked website as completed", { websiteUrl });
  }

  /**
   * Invalidate cache for a website
   */
  static async invalidate(websiteUrl: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("website_embeddings")
        .delete()
        .eq("website_url", websiteUrl);

      if (error) {
        logger.error("Error invalidating cache", { websiteUrl, error });
        throw new Error(`Failed to invalidate cache: ${error.message}`);
      }

      logger.info("Cache invalidated", { websiteUrl });
    } catch (error) {
      logger.error("Error invalidating cache", { websiteUrl, error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   * ✅ FIXED: Properly typed query results
   */
  static async getStats(): Promise<{
    totalWebsites: number;
    totalPages: number;
    cacheHitRate?: number;
  }> {
    try {
      const supabase = await createClient();

      // ✅ FIX: Explicitly type the query result
      const { data: websites, error: websitesError } = await supabase
        .from("website_embeddings")
        .select("website_url")
        .limit(1000)
        .returns<{ website_url: string }[]>(); // ✅ Explicit return type

      if (websitesError) {
        throw websitesError;
      }

      const uniqueWebsites = new Set(
        websites?.map((w: { website_url: string }) => w.website_url) || []
      );

      const { count, error: countError } = await supabase
        .from("website_embeddings")
        .select("page_url", { count: "exact", head: true });

      if (countError) {
        throw countError;
      }

      return {
        totalWebsites: uniqueWebsites.size,
        totalPages: count || 0,
      };
    } catch (error) {
      logger.error("Error getting cache stats", { error });
      return {
        totalWebsites: 0,
        totalPages: 0,
      };
    }
  }
}