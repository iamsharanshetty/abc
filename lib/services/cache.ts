// lib/services/cache.ts
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

interface CacheEntry {
  websiteUrl: string;
  lastScraped: string;
  pagesCount: number;
  status: "completed" | "in_progress" | "failed";
}

/**
 * Cache service to track recently analyzed websites
 */
export class CacheService {
  private static CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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
   */
  static async getCacheEntry(websiteUrl: string): Promise<CacheEntry | null> {
    try {
      const supabase = await createClient();

      // Check if we have recent embeddings
      const { data, error } = await supabase
        .from("website_embeddings")
        .select("created_at")
        .eq("website_url", websiteUrl)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        logger.error("Database error checking cache", { error });
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Count total pages
      const { count } = await supabase
        .from("website_embeddings")
        .select("page_url", { count: "exact", head: true })
        .eq("website_url", websiteUrl);

      return {
        websiteUrl,
        lastScraped: data[0].created_at,
        pagesCount: count || 0,
        status: "completed",
      };
    } catch (error) {
      logger.error("Error getting cache entry", { websiteUrl, error });
      return null;
    }
  }

  /**
   * Mark a website as being analyzed (to prevent concurrent analyses)
   */
  static async markInProgress(websiteUrl: string): Promise<void> {
    // This is a simple implementation
    // In production, you might want to use Redis or a proper job queue
    logger.info("Marked website as in progress", { websiteUrl });
  }

  /**
   * Mark analysis as completed
   */
  static async markCompleted(websiteUrl: string): Promise<void> {
    logger.info("Marked website as completed", { websiteUrl });
  }

  /**
   * Invalidate cache for a website (force re-analysis)
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
   */
  static async getStats(): Promise<{
    totalWebsites: number;
    totalPages: number;
    cacheHitRate?: number;
  }> {
    try {
      const supabase = await createClient();

      // Get unique websites count
      const { data: websites, error: websitesError } = await supabase
        .from("website_embeddings")
        .select("website_url")
        .limit(1000);

      if (websitesError) {
        throw websitesError;
      }

      const uniqueWebsites = new Set(websites?.map((w) => w.website_url) || []);

      // Get total pages count
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
