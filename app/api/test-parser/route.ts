// app/api/test-parser/route.ts - IMPROVED WITH FALLBACK STRATEGY
import { NextRequest, NextResponse } from "next/server";
import { WebScraper } from "@/lib/services/scraper";
import { BrowserScraper } from "@/lib/services/browserScraper";
import { EmbeddingService } from "@/lib/services/embeddings";

interface TestResult {
  url: string;
  success: boolean;
  scraperUsed: "axios" | "puppeteer";
  attempts: Array<{
    method: string;
    success: boolean;
    pagesFound?: number;
    error?: string;
  }>;
  pagesScraped: number;
  totalWords: number;
  averageQuality: number;
  averageWordCount?: number;
  duration: number;
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  warnings: string[];
  sampleContent?: {
    title: string;
    wordCount: number;
    contentPreview: string;
  };
  recommendations?: string[];
  embeddingsCreated?: number;
  embeddingsSkipped?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const testUrl = searchParams.get("url");
  const forceBrowser = searchParams.get("browser") === "true";
  const runAll = searchParams.get("all") === "true";

  try {
    // Show available tests
    if (!testUrl && !runAll) {
      return NextResponse.json({
        message: "WebRep Content Parser Test API",
        usage: {
          testSingleUrl: "/api/test-parser?url=https://example.com",
          testWithBrowser:
            "/api/test-parser?url=https://example.com&browser=true",
          testAll: "/api/test-parser?all=true",
        },
        tips: {
          javascript_sites:
            "Use browser=true for JavaScript-heavy sites (React, Vue, Angular)",
          static_sites:
            "Static sites work fine without browser parameter (faster)",
          troubleshooting: "If scraping fails, try adding &browser=true",
        },
      });
    }

    // Test single URL with smart fallback
    if (testUrl) {
      console.log(`\n${"=".repeat(70)}`);
      console.log(`Testing: ${testUrl}`);
      console.log(`Force Browser Mode: ${forceBrowser}`);
      console.log(`${"=".repeat(70)}\n`);

      const result = await testUrlWithFallback(testUrl, forceBrowser);

      return NextResponse.json({
        success: result.success,
        result,
        tips: generateTips(result),
      });
    }

    // Run all tests - not implemented in this simplified version
    return NextResponse.json({
      success: false,
      error:
        "Full test suite not available in this version. Use url parameter instead.",
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Test URL with smart fallback strategy
 */
async function testUrlWithFallback(
  url: string,
  forceBrowser: boolean
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    url,
    success: false,
    scraperUsed: forceBrowser ? "puppeteer" : "axios",
    attempts: [],
    pagesScraped: 0,
    totalWords: 0,
    averageQuality: 0,
    duration: 0,
    errors: [],
    warnings: [],
  };

  try {
    let pages: any[] = [];

    // Strategy 1: Try regular scraper first (unless browser is forced)
    if (!forceBrowser) {
      console.log("📥 Attempt 1: Regular HTTP scraper (faster)...");
      try {
        const scraper = new WebScraper(url, 3);
        pages = await scraper.scrapeWebsite();
        result.scraperUsed = "axios";
        result.attempts.push({
          method: "axios",
          success: pages.length > 0,
          pagesFound: pages.length,
        });

        if (pages.length > 0) {
          console.log(
            `✅ Regular scraper succeeded! Found ${pages.length} pages`
          );
        } else {
          console.log(`⚠️ Regular scraper found no content, trying browser...`);
        }
      } catch (error) {
        console.log(
          `⚠️ Regular scraper failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        result.attempts.push({
          method: "axios",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Strategy 2: Try browser scraper if regular failed or was forced
    if (pages.length === 0) {
      console.log(
        "🌐 Attempt 2: Browser-based scraper (slower but handles JavaScript)..."
      );
      try {
        const browserScraper = new BrowserScraper(url, 3);
        pages = await browserScraper.scrapeWebsite();
        result.scraperUsed = "puppeteer";
        result.attempts.push({
          method: "puppeteer",
          success: pages.length > 0,
          pagesFound: pages.length,
        });

        if (pages.length > 0) {
          console.log(
            `✅ Browser scraper succeeded! Found ${pages.length} pages`
          );
        } else {
          console.log(`❌ Browser scraper also found no content`);
        }
      } catch (error) {
        console.log(
          `❌ Browser scraper failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        result.attempts.push({
          method: "puppeteer",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Analyze results
    if (pages.length === 0) {
      result.errors.push({
        type: "NO_PAGES_SCRAPED",
        message: "No pages were successfully scraped with any method",
        timestamp: new Date().toISOString(),
      });
      result.recommendations = [
        "This site may have strong anti-bot protections",
        "Check if the site requires login or has CAPTCHA",
        "The site might be blocking all automated access",
        "Consider using a proxy or residential IP",
      ];
    } else {
      // Calculate statistics
      let totalQuality = 0;
      let totalWords = 0;

      for (const page of pages) {
        totalQuality += page.qualityScore;
        totalWords += page.parsedContent.metadata.wordCount;
      }

      result.success = true;
      result.pagesScraped = pages.length;
      result.totalWords = totalWords;
      result.averageQuality = totalQuality / pages.length;
      result.averageWordCount = totalWords / pages.length;

      // Sample content
      if (pages[0]) {
        result.sampleContent = {
          title: pages[0].title,
          wordCount: pages[0].parsedContent.metadata.wordCount,
          contentPreview: pages[0].content.substring(0, 200),
        };
      }

      result.recommendations = [
        `✓ Successfully scraped with ${result.scraperUsed}`,
        `Found ${
          pages.length
        } pages with average quality ${result.averageQuality.toFixed(0)}/100`,
      ];

      // Try to generate embeddings for first page
      if (pages[0]) {
        try {
          console.log("\n🧠 Generating embeddings for first page...");
          const embeddingService = new EmbeddingService();

          // Delete old embeddings
          await embeddingService.deleteWebsiteEmbeddings(url);

          const embeddingResult = await embeddingService.storeEmbeddings(
            url,
            pages[0].url,
            pages[0].content,
            {
              title: pages[0].title,
              scrapedAt: new Date().toISOString(),
            }
          );

          result.embeddingsCreated = embeddingResult.chunksSaved;
          result.embeddingsSkipped = embeddingResult.chunksSkipped;
          console.log(`✅ Created ${result.embeddingsCreated} embeddings`);
        } catch (embError) {
          console.error("⚠️ Failed to create embeddings:", embError);
          result.warnings.push("Embeddings generation failed");
        }
      }
    }
  } catch (error) {
    result.errors.push({
      type: "TEST_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Generate helpful tips based on test results
 */
function generateTips(result: TestResult): string[] {
  const tips: string[] = [];

  if (!result.success) {
    tips.push("❌ Scraping failed - see recommendations above");
    tips.push("💡 Try adding &browser=true if you haven't already");
    tips.push(
      "🔍 Use /api/debug-scraper?url=YOUR_URL for detailed diagnostics"
    );
  } else {
    tips.push(`✅ Successfully scraped using ${result.scraperUsed}`);

    if (result.scraperUsed === "puppeteer") {
      tips.push("⚡ This site requires JavaScript rendering");
      tips.push("💰 Browser scraping is slower and more expensive");
    } else {
      tips.push("⚡ This site works with fast HTTP scraping");
      tips.push("💰 HTTP scraping is faster and cheaper");
    }

    if (result.averageQuality < 50) {
      tips.push(
        "⚠️ Content quality is low - check if you're getting the right pages"
      );
    }
  }

  return tips;
}
