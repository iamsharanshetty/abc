// trigger/analyze-website.ts
import { eventTrigger } from "@trigger.dev/sdk";
import { client } from "./client";
import { WebScraper } from "@/lib/services/scraper";
import { BrowserScraper } from "@/lib/services/browserScraper";
import { EmbeddingService } from "@/lib/services/embeddings";
import { DeduplicationService } from "@/lib/services/deduplication";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";

export interface AnalyzeWebsitePayload {
  jobId: string;
  url: string;
  maxPages?: number;
  useBrowser?: boolean;
  agentRole?: string;
}

export interface AnalyzeWebsiteProgress {
  status:
    | "queued"
    | "scraping"
    | "parsing"
    | "embedding"
    | "completed"
    | "failed";
  progress: number; // 0-100
  message: string;
  currentStep: string;
  pagesScraped?: number;
  pagesProcessed?: number;
  error?: string;
}

// Helper function to update progress
async function updateProgress(jobId: string, progress: AnalyzeWebsiteProgress) {
  const supabase = await createClient();
  await supabase.from("job_progress").upsert({
    job_id: jobId,
    status: progress.status,
    progress: progress.progress,
    message: progress.message,
    current_step: progress.currentStep,
    pages_scraped: progress.pagesScraped,
    pages_processed: progress.pagesProcessed,
    error: progress.error,
    updated_at: new Date().toISOString(),
  });
}

// Define the job using v3 syntax
client.defineJob({
  id: "analyze-website",
  name: "Analyze Website",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "website.analyze",
  }),
  run: async (payload: AnalyzeWebsitePayload, io, ctx) => {
    const {
      jobId,
      url,
      maxPages = 50,
      useBrowser = false,
      agentRole,
    } = payload;

    await io.logger.info("Starting website analysis job", { jobId, url });

    try {
      // Step 1: Initialize (5%)
      await updateProgress(jobId, {
        status: "scraping",
        progress: 5,
        message: "Initializing website scraper...",
        currentStep: "initialization",
      });

      // Step 2: Scrape Website (5% -> 40%)
      await io.logger.info("Starting scrape", { url });

      await updateProgress(jobId, {
        status: "scraping",
        progress: 10,
        message: `Scraping website: ${url}`,
        currentStep: "scraping",
      });

      const deduplicationService = new DeduplicationService();
      let pages;
      let scraperUsed: "axios" | "puppeteer";

      if (useBrowser) {
        const browserScraper = new BrowserScraper(url, maxPages);
        pages = await browserScraper.scrapeWebsite();
        scraperUsed = "puppeteer";
      } else {
        const scraper = new WebScraper(url, maxPages);
        pages = await scraper.scrapeWebsite();
        scraperUsed = "axios";

        // Fallback to browser if no pages found
        if (pages.length === 0) {
          await updateProgress(jobId, {
            status: "scraping",
            progress: 20,
            message: "Switching to browser-based scraping...",
            currentStep: "scraping-fallback",
          });

          const browserScraper = new BrowserScraper(url, maxPages);
          pages = await browserScraper.scrapeWebsite();
          scraperUsed = "puppeteer";
        }
      }

      if (pages.length === 0) {
        throw new Error("No content found on the website");
      }

      await updateProgress(jobId, {
        status: "parsing",
        progress: 40,
        message: `Found ${pages.length} pages. Parsing content...`,
        currentStep: "parsing",
        pagesScraped: pages.length,
      });

      // Step 3: Generate Embeddings (40% -> 90%)
      await updateProgress(jobId, {
        status: "embedding",
        progress: 50,
        message: "Generating AI embeddings...",
        currentStep: "embedding",
      });

      const embeddingService = new EmbeddingService();

      // Delete existing embeddings
      await embeddingService.deleteWebsiteEmbeddings(url);

      let processedPages = 0;
      let skippedDuplicates = 0;
      const errors: Array<{ url: string; error: string }> = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Update progress for each page
        const progressPercent = 50 + Math.floor((i / pages.length) * 40);
        await updateProgress(jobId, {
          status: "embedding",
          progress: progressPercent,
          message: `Processing page ${i + 1} of ${pages.length}...`,
          currentStep: "embedding",
          pagesProcessed: processedPages,
        });

        if (page.content.length < 100) {
          continue;
        }

        // Check for duplicates
        if (
          deduplicationService.isDuplicate(page.url, page.title, page.content)
        ) {
          skippedDuplicates++;
          continue;
        }

        try {
          await embeddingService.storeEmbeddings(url, page.url, page.content, {
            title: page.title,
            scrapedAt: new Date().toISOString(),
          });
          processedPages++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({ url: page.url, error: errorMessage });
        }
      }

      // Step 4: Complete (90% -> 100%)
      await updateProgress(jobId, {
        status: "completed",
        progress: 100,
        message: "Website analysis completed successfully!",
        currentStep: "completed",
        pagesScraped: pages.length,
        pagesProcessed: processedPages,
      });

      const dedupStats = deduplicationService.getStats();

      return {
        success: true,
        data: {
          websiteUrl: url,
          pagesScraped: pages.length,
          pagesProcessed: processedPages,
          skippedDuplicates,
          scraperUsed,
          agentRole,
          deduplication: dedupStats,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      await io.logger.error("Website analysis job failed", { jobId, error });

      await updateProgress(jobId, {
        status: "failed",
        progress: 0,
        message: "Analysis failed",
        currentStep: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});
