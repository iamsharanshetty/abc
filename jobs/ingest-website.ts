// jobs/ingest-website.ts
import { task, logger } from "@trigger.dev/sdk/v3";
import { WebScraper } from "@/lib/services/scraper";
import { BrowserScraper } from "@/lib/services/browserScraper";
import { EmbeddingService } from "@/lib/services/embeddings";

export interface IngestWebsitePayload {
  url: string;
  maxPages?: number;
  useBrowser?: boolean;
  forceRefresh?: boolean;
  userId?: string;
}

export interface IngestWebsiteResult {
  success: boolean;
  websiteUrl: string;
  pagesScraped: number;
  pagesProcessed: number;
  embeddingsCreated: number;
  duration: number;
  error?: string;
  [key: string]: unknown; // Add index signature to satisfy Trigger.dev's requirements
}

export const ingestWebsiteTask = task({
  id: "ingest-website",
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: IngestWebsitePayload): Promise<IngestWebsiteResult> => {
    const startTime = Date.now();

    logger.info("Starting website ingestion task", {
      url: payload.url,
    });

    try {
      await logger.info("🔍 Step 1/4: Starting website scraping...");

      let pages;
      let scraperUsed: "axios" | "puppeteer";

      if (payload.useBrowser) {
        const browserScraper = new BrowserScraper(
          payload.url,
          payload.maxPages
        );
        pages = await browserScraper.scrapeWebsite();
        scraperUsed = "puppeteer";
      } else {
        const scraper = new WebScraper(payload.url, payload.maxPages);
        pages = await scraper.scrapeWebsite();
        scraperUsed = "axios";

        if (pages.length === 0) {
          await logger.warn(
            "No pages found with HTTP scraper, trying browser..."
          );
          const browserScraper = new BrowserScraper(
            payload.url,
            payload.maxPages
          );
          pages = await browserScraper.scrapeWebsite();
          scraperUsed = "puppeteer";
        }
      }

      if (pages.length === 0) {
        throw new Error("No content found on the website");
      }

      await logger.info(
        `✅ Scraped ${pages.length} pages using ${scraperUsed}`
      );

      await logger.info("🧠 Step 2/4: Generating embeddings...");

      const embeddingService = new EmbeddingService();
      await embeddingService.deleteWebsiteEmbeddings(payload.url);

      let processedPages = 0;
      let totalEmbeddings = 0;
      const errors: string[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        if (page.content.length < 100) {
          continue;
        }

        try {
          await logger.info(
            `Processing page ${i + 1}/${pages.length}: ${page.url}`
          );

          const result = await embeddingService.storeEmbeddings(
            payload.url,
            page.url,
            page.content,
            {
              title: page.title,
              scrapedAt: new Date().toISOString(),
            }
          );

          totalEmbeddings += result.chunksSaved;
          processedPages++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to process ${page.url}: ${errorMessage}`);
          await logger.error(`Error processing ${page.url}`, {
            error: errorMessage,
          });
        }
      }

      const duration = Date.now() - startTime;

      await logger.info("✅ Step 3/4: Embeddings generated successfully");
      await logger.info("🎉 Step 4/4: Task completed!");

      const result: IngestWebsiteResult = {
        success: true,
        websiteUrl: payload.url,
        pagesScraped: pages.length,
        pagesProcessed: processedPages,
        embeddingsCreated: totalEmbeddings,
        duration,
      };

      logger.info("Website ingestion completed", result);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await logger.error("❌ Task failed", { error: errorMessage });

      const failureResult: IngestWebsiteResult = {
        success: false,
        websiteUrl: payload.url,
        pagesScraped: 0,
        pagesProcessed: 0,
        embeddingsCreated: 0,
        duration,
        error: errorMessage,
      };

      return failureResult;
    }
  },
});
