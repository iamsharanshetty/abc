// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  validateAndSanitizeUrl,
  validateMaxPages,
  validateBoolean,
} from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { WebScraper } from "@/lib/services/scraper";
import { BrowserScraper } from "@/lib/services/browserScraper";
import { EmbeddingService } from "@/lib/services/embeddings";
import { config } from "@/lib/config";
import { CacheService } from "@/lib/services/cache";
import { DeduplicationService } from "@/lib/services/deduplication";
import { ValidationError } from "@/lib/errors/AppError";
import {
  analyzeRateLimiter,
  withRateLimit,
} from "@/lib/middleware/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    logger.info("Received analyze request", { url: body.url });

    // Validate inputs
    const url = validateAndSanitizeUrl(body.url);
    const maxPages = validateMaxPages(body.maxPages);
    const useBrowser = validateBoolean(body.useBrowser, false);
    const forceRefresh = validateBoolean(body.forceRefresh, false);
    const deduplicationService = new DeduplicationService();

    logger.debug("Validation passed", {
      url,
      maxPages,
      useBrowser,
      forceRefresh,
    });

    // Check cache (unless forceRefresh is true)
    if (!forceRefresh) {
      const isCached = await CacheService.isCached(url);

      if (isCached) {
        const cacheEntry = await CacheService.getCacheEntry(url);

        logger.info("Returning cached result", { url });

        return NextResponse.json({
          success: true,
          cached: true,
          data: {
            websiteUrl: url,
            pagesScraped: cacheEntry?.pagesCount || 0,
            pagesProcessed: cacheEntry?.pagesCount || 0,
            message: "Returned from cache (analyzed within last 24 hours)",
            lastAnalyzed: cacheEntry?.lastScraped,
          },
        });
      }
    } else {
      logger.info("Force refresh requested, invalidating cache", { url });
      await CacheService.invalidate(url);
    }

    // Mark as in progress
    await CacheService.markInProgress(url);

    // Step 1: Scrape website
    let pages;
    let scraperUsed: "axios" | "puppeteer";

    if (useBrowser) {
      logger.info("Using browser scraper", { url });
      const browserScraper = new BrowserScraper(url, maxPages);
      pages = await browserScraper.scrapeWebsite();
      scraperUsed = "puppeteer";
    } else {
      logger.info("Using HTTP scraper", { url });
      const scraper = new WebScraper(url, maxPages);
      pages = await scraper.scrapeWebsite();
      scraperUsed = "axios";

      // Fallback to browser if no pages found
      if (pages.length === 0) {
        logger.warn("HTTP scraper found no pages, falling back to browser", {
          url,
        });
        const browserScraper = new BrowserScraper(url, maxPages);
        pages = await browserScraper.scrapeWebsite();
        scraperUsed = "puppeteer";
      }
    }

    if (pages.length === 0) {
      throw new ValidationError("No content found on the website");
    }

    logger.info("Scraping complete", { url, pagesFound: pages.length });

    // Step 2: Generate embeddings
    const embeddingService = new EmbeddingService();

    // Delete existing embeddings first
    logger.debug("Deleting existing embeddings", { url });
    await embeddingService.deleteWebsiteEmbeddings(url);

    // Generate embeddings for each page
    let processedPages = 0;
    let skippedDuplicates = 0;
    const errors: Array<{ url: string; error: string }> = [];

    for (const page of pages) {
      if (page.content.length < 100) {
        logger.debug("Skipping page (too short)", { pageUrl: page.url });
        continue;
      }

      // Check for duplicates
      if (
        deduplicationService.isDuplicate(page.url, page.title, page.content)
      ) {
        skippedDuplicates++;
        logger.debug("Skipping duplicate page", { pageUrl: page.url });
        continue;
      }

      try {
        await embeddingService.storeEmbeddings(url, page.url, page.content, {
          title: page.title,
          scrapedAt: new Date().toISOString(),
        });
        processedPages++;
        logger.debug("Processed page successfully", { pageUrl: page.url });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to process page", {
          pageUrl: page.url,
          error: errorMessage,
        });
        errors.push({ url: page.url, error: errorMessage });
      }
    }

    // Get deduplication stats
    const dedupStats = deduplicationService.getStats();

    logger.info("Analysis complete", {
      url,
      pagesScraped: pages.length,
      pagesProcessed: processedPages,
      skippedDuplicates,
      errors: errors.length,
      ...dedupStats,
    });

    return NextResponse.json({
      success: true,
      data: {
        websiteUrl: url,
        pagesScraped: pages.length,
        pagesProcessed: processedPages,
        skippedDuplicates,
        scraperUsed,
        message: `Successfully analyzed ${processedPages} out of ${pages.length} pages`,
        deduplication: dedupStats,
        ...(errors.length > 0 && { errors }),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
