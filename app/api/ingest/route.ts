// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { WebScraper } from "@/lib/services/scraper";
import { BrowserScraper } from "@/lib/services/browserScraper";
import { EmbeddingService } from "@/lib/services/embeddings";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndSanitizeUrl,
  validateMaxPages,
  validateBoolean,
} from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

interface IngestResponse {
  success: boolean;
  data?: {
    websiteUrl: string;
    pagesScraped: number;
    pagesProcessed: number;
    message: string;
    scraperUsed: "axios" | "puppeteer";
  };
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<IngestResponse>> {
  try {
    const body = await request.json();

    logger.info("Received ingest request", { url: body.url });

    // Validate inputs using our new validation utilities
    const url = validateAndSanitizeUrl(body.url);
    const maxPages = validateMaxPages(body.maxPages);
    const useBrowser = validateBoolean(body.useBrowser, false);

    logger.debug("Starting ingestion", { url, maxPages, useBrowser });

    // Choose scraper based on useBrowser flag
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

      // If no pages found, suggest using browser mode
      if (pages.length === 0) {
        throw new ValidationError(
          "No content found. This might be a JavaScript-rendered site. Try again with 'useBrowser: true'",
          { scraperUsed: "axios", suggestion: "Use browser mode" }
        );
      }
    }

    if (pages.length === 0) {
      throw new ValidationError("No content found on the website");
    }

    logger.info("Scraping complete", { url, pagesFound: pages.length });

    // Initialize embedding service
    const embeddingService = new EmbeddingService();

    // Delete existing embeddings
    logger.debug("Deleting existing embeddings", { url });
    try {
      await embeddingService.deleteWebsiteEmbeddings(url);
    } catch (error) {
      logger.warn("Failed to delete existing embeddings", { error });
    }

    // Generate and store embeddings
    let processedPages = 0;
    const errors: Array<{ url: string; error: string }> = [];

    for (const page of pages) {
      logger.debug("Processing page", {
        pageUrl: page.url,
        index: processedPages + 1,
        total: pages.length,
      });

      if (page.content.length < 100) {
        logger.debug("Skipped page (too short)", { pageUrl: page.url });
        continue;
      }

      try {
        await embeddingService.storeEmbeddings(url, page.url, page.content, {
          title: page.title,
          scrapedAt: new Date().toISOString(),
        });
        processedPages++;
        logger.debug("Successfully processed page", { pageUrl: page.url });
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

    logger.info("Ingestion complete", {
      url,
      pagesScraped: pages.length,
      pagesProcessed: processedPages,
      errors: errors.length,
    });

    const response: IngestResponse = {
      success: true,
      data: {
        websiteUrl: url,
        pagesScraped: pages.length,
        pagesProcessed: processedPages,
        message: `Successfully ingested ${processedPages} out of ${pages.length} pages`,
        scraperUsed,
      },
    };

    if (errors.length > 0) {
      logger.warn("Some pages failed to process", {
        errorCount: errors.length,
      });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

// GET endpoint remains the same but with better error handling
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      throw new ValidationError("URL parameter is required");
    }

    const url = validateAndSanitizeUrl(urlParam);

    logger.info("Fetching ingestion status", { url });

    const supabase = await createClient();

    type EmbeddingItem = {
      page_url: string;
      created_at: string;
      metadata: any;
    };

    const { data, error } = await supabase
      .from("website_embeddings")
      .select("page_url, created_at, metadata")
      .eq("website_url", url)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    const typedData = data as EmbeddingItem[] | null;

    const uniquePages = new Map<string, EmbeddingItem>();
    typedData?.forEach((item) => {
      if (!uniquePages.has(item.page_url)) {
        uniquePages.set(item.page_url, item);
      }
    });

    logger.info("Ingestion status retrieved", {
      url,
      pagesFound: uniquePages.size,
    });

    return NextResponse.json({
      success: true,
      data: {
        websiteUrl: url,
        totalEmbeddings: typedData?.length || 0,
        uniquePages: uniquePages.size,
        pages: Array.from(uniquePages.values()),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
