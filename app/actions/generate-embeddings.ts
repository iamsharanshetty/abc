"use server";

import { WebScraper } from "@/lib/services/scraper";
import { EmbeddingService } from "@/lib/services/embeddings";


export type GenerateEmbeddingsResult = {
    success: boolean;
    message: string;
    pagesProcessed?: number;
    errors?: string[];
};

export async function generateContentEmbeddings(
    url: string
): Promise<GenerateEmbeddingsResult> {
    console.log("DEBUG: OPENAI_API_KEY is:", process.env.OPENAI_API_KEY?.slice(0, 10) + "...");
    try {
        // 1. Validate URL
        if (!url) {
            return { success: false, message: "URL is required" };
        }

        try {
            new URL(url);
        } catch {
            return { success: false, message: "Invalid URL format" };
        }

        // 2. Initialize services
        // Use a smaller maxPages limit for the server action to avoid timeouts
        // The user can configure this in config.ts, but we override it here for safety if needed
        // For now, we'll use the config value but be mindful of the 60s timeout on Vercel/Next.js
        const scraper = new WebScraper(url);
        const embeddingService = new EmbeddingService();

        // 3. Scrape website
        console.log(`Starting scrape for ${url}...`);
        const pages = await scraper.scrapeWebsite();

        if (pages.length === 0) {
            return {
                success: false,
                message: "No pages found or website could not be accessed",
            };
        }

        console.log(`Scraped ${pages.length} pages. Generating embeddings...`);

        // 4. Generate and store embeddings
        const errors: string[] = [];
        let processedCount = 0;

        // Process sequentially or in small batches to manage resources
        for (const page of pages) {
            try {
                await embeddingService.storeEmbeddings(
                    url,
                    page.url,
                    page.content,
                    {
                        title: page.title,
                        scrapedAt: new Date().toISOString(),
                    }
                );
                processedCount++;
            } catch (error) {
                console.error(`Failed to process page ${page.url}:`, error);
                errors.push(
                    `Failed to process ${page.url}: ${error instanceof Error ? error.message : "Unknown error"
                    }`
                );
            }
        }

        // 5. Return result
        if (processedCount === 0) {
            return {
                success: false,
                message: `Failed to generate embeddings: ${errors[0] || "Unknown error"}`,
                errors,
            };
        }

        return {
            success: true,
            message: `Successfully processed ${processedCount} pages`,
            pagesProcessed: processedCount,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        console.error("Error in generateContentEmbeddings:", error);
        return {
            success: false,
            message: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"
                }`,
        };
    }
}
