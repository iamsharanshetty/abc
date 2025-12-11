// lib/services/comprehensiveTester.ts
import { WebScraper } from "./scraper";
import { BrowserScraper } from "./browserScraper";
import { EmbeddingService } from "./embeddings";
import { createClient } from "../supabase/server";

/**
 * Comprehensive test cases covering different tech stacks and scenarios
 */
export const COMPREHENSIVE_TEST_WEBSITES = [
  // 1. Static HTML Site
  {
    url: "https://example.com",
    techStack: "Static HTML",
    renderingType: "Static",
    expectedPages: 1,
    useBrowser: false,
    description: "Simple static HTML site - baseline test",
  },

  // 2. Documentation Site (SSG)
  {
    url: "https://nodejs.org/en/about",
    techStack: "Node.js Documentation",
    renderingType: "SSG (Static Site Generation)",
    expectedPages: 2,
    useBrowser: false,
    description: "Documentation with good structure and content",
  },

  // 3. Modern Blog (SSG with Markdown)
  {
    url: "https://vercel.com/blog",
    techStack: "Next.js Blog",
    renderingType: "SSG/ISR",
    expectedPages: 3,
    useBrowser: false,
    description: "Modern blog with rich content",
  },

  // 4. E-commerce (SSR)
  {
    url: "https://stripe.com/docs",
    techStack: "Documentation Platform",
    renderingType: "SSR (Server-Side Rendering)",
    expectedPages: 3,
    useBrowser: false,
    description: "Technical documentation with complex structure",
  },

  // 5. Marketing Site (Static)
  {
    url: "https://tailwindcss.com",
    techStack: "Tailwind CSS Marketing",
    renderingType: "Static/SSG",
    expectedPages: 3,
    useBrowser: false,
    description: "Marketing site with examples and documentation",
  },

  // 6. SPA with CSR (Client-Side Rendering)
  {
    url: "https://react.dev",
    techStack: "React Documentation",
    renderingType: "SSG/Hybrid",
    expectedPages: 3,
    useBrowser: true,
    description: "Modern React docs - may need browser",
  },

  // 7. News/Content Site (SSR)
  {
    url: "https://github.com/features",
    techStack: "GitHub Features",
    renderingType: "SSR",
    expectedPages: 2,
    useBrowser: false,
    description: "Content-heavy page with dynamic elements",
  },

  // 8. Portfolio Site (Static)
  {
    url: "https://www.mozilla.org/en-US/about/",
    techStack: "Mozilla About",
    renderingType: "Static/CMS",
    expectedPages: 2,
    useBrowser: false,
    description: "Organization about page",
  },

  // 9. Modern SPA (Heavy JavaScript)
  {
    url: "https://vuejs.org",
    techStack: "Vue.js Site",
    renderingType: "SSG/Hybrid",
    expectedPages: 2,
    useBrowser: true,
    description: "Vue documentation - JavaScript heavy",
  },

  // 10. Complex Application
  {
    url: "https://www.python.org",
    techStack: "Python.org",
    renderingType: "Traditional CMS",
    expectedPages: 3,
    useBrowser: false,
    description: "Traditional CMS with good structure",
  },
];

export interface DetailedTestResult {
  url: string;
  techStack: string;
  renderingType: string;
  success: boolean;
  scraperUsed: "axios" | "puppeteer";

  // Scraping metrics
  pagesScraped: number;
  expectedPages: number;
  pagesMetExpectation: boolean;

  // Content quality
  totalWords: number;
  averageQuality: number;
  averageWordCount: number;

  // Embedding metrics
  embeddingsCreated: number;
  embeddingsSkipped: number;
  costSavings: number;

  // Performance
  duration: number;
  averagePageTime: number;

  // Error tracking
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
    context?: any;
  }>;
  warnings: string[];

  // Edge cases detected
  edgeCases: {
    hadJavaScriptContent: boolean;
    hadMinimalContent: boolean;
    hadRepetitiveContent: boolean;
    hadUnusualStructure: boolean;
    hadBlockingMechanisms: boolean;
  };

  // Sample data
  sampleContent?: {
    title: string;
    wordCount: number;
    headingsCount: number;
    paragraphsCount: number;
    contentPreview: string;
  };

  // Recommendations
  recommendations: string[];
}

export class ComprehensiveTester {
  private embeddingService: EmbeddingService;
  private testResults: DetailedTestResult[] = [];

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Test a single website with comprehensive error tracking
   */
  async testWebsite(
    testCase: (typeof COMPREHENSIVE_TEST_WEBSITES)[0]
  ): Promise<DetailedTestResult> {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`Testing: ${testCase.url}`);
    console.log(`Tech Stack: ${testCase.techStack}`);
    console.log(`Rendering: ${testCase.renderingType}`);
    console.log(`Expected Pages: ${testCase.expectedPages}`);
    console.log(`${"=".repeat(70)}\n`);

    const startTime = Date.now();
    const result: DetailedTestResult = {
      url: testCase.url,
      techStack: testCase.techStack,
      renderingType: testCase.renderingType,
      success: false,
      scraperUsed: testCase.useBrowser ? "puppeteer" : "axios",
      pagesScraped: 0,
      expectedPages: testCase.expectedPages,
      pagesMetExpectation: false,
      totalWords: 0,
      averageQuality: 0,
      averageWordCount: 0,
      embeddingsCreated: 0,
      embeddingsSkipped: 0,
      costSavings: 0,
      duration: 0,
      averagePageTime: 0,
      errors: [],
      warnings: [],
      edgeCases: {
        hadJavaScriptContent: false,
        hadMinimalContent: false,
        hadRepetitiveContent: false,
        hadUnusualStructure: false,
        hadBlockingMechanisms: false,
      },
      recommendations: [],
    };

    try {
      // Step 1: Scrape website
      console.log("📥 Step 1: Scraping website...");
      const scrapeStartTime = Date.now();

      let pages;
      if (testCase.useBrowser) {
        try {
          const browserScraper = new BrowserScraper(
            testCase.url,
            testCase.expectedPages
          );
          pages = await browserScraper.scrapeWebsite();
          result.scraperUsed = "puppeteer";
        } catch (error) {
          result.warnings.push("Browser scraping failed, falling back to HTTP");
          result.errors.push({
            type: "BROWSER_SCRAPE_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          });

          // Fallback to regular scraper
          const scraper = new WebScraper(testCase.url, testCase.expectedPages);
          pages = await scraper.scrapeWebsite();
          result.scraperUsed = "axios";
        }
      } else {
        const scraper = new WebScraper(testCase.url, testCase.expectedPages);
        pages = await scraper.scrapeWebsite();
      }

      const scrapeEndTime = Date.now();
      result.pagesScraped = pages.length;
      result.averagePageTime =
        pages.length > 0 ? (scrapeEndTime - scrapeStartTime) / pages.length : 0;

      // Check if we met expectations
      result.pagesMetExpectation = pages.length >= testCase.expectedPages;
      if (!result.pagesMetExpectation) {
        result.warnings.push(
          `Expected ${testCase.expectedPages} pages but got ${pages.length}`
        );
      }

      // Step 2: Analyze scraped content
      if (pages.length === 0) {
        result.errors.push({
          type: "NO_PAGES_SCRAPED",
          message: "No pages were successfully scraped",
          timestamp: new Date().toISOString(),
          context: { testCase },
        });

        result.edgeCases.hadBlockingMechanisms = true;
        result.recommendations.push(
          "Consider using browser-based scraping for this site"
        );
        result.recommendations.push(
          "Check if the site has anti-scraping measures"
        );

        result.duration = Date.now() - startTime;
        return result;
      }

      console.log("📊 Step 2: Analyzing content quality...");

      let totalQuality = 0;
      let totalWords = 0;
      const qualityScores: number[] = [];
      const wordCounts: number[] = [];

      for (const page of pages) {
        totalQuality += page.qualityScore;
        totalWords += page.parsedContent.metadata.wordCount;
        qualityScores.push(page.qualityScore);
        wordCounts.push(page.parsedContent.metadata.wordCount);

        // Detect edge cases
        if (page.parsedContent.metadata.wordCount < 100) {
          result.edgeCases.hadMinimalContent = true;
          result.warnings.push(`Page ${page.url} has very little content`);
        }

        if (page.qualityScore < 30) {
          result.edgeCases.hadUnusualStructure = true;
          result.warnings.push(
            `Page ${page.url} has unusual structure (quality: ${page.qualityScore})`
          );
        }
      }

      result.averageQuality = totalQuality / pages.length;
      result.totalWords = totalWords;
      result.averageWordCount = totalWords / pages.length;

      // Sample content from first page
      const firstPage = pages[0];
      result.sampleContent = {
        title: firstPage.title,
        wordCount: firstPage.parsedContent.metadata.wordCount,
        headingsCount: firstPage.parsedContent.headings.length,
        paragraphsCount: firstPage.parsedContent.paragraphs.length,
        contentPreview: firstPage.content.substring(0, 200),
      };

      // Step 3: Generate embeddings
      console.log("🧠 Step 3: Generating embeddings...");

      try {
        // Clean up existing embeddings first
        await this.embeddingService.deleteWebsiteEmbeddings(testCase.url);

        const embeddingResult = await this.embeddingService.storeEmbeddings(
          testCase.url,
          firstPage.url,
          firstPage.content,
          {
            title: firstPage.title,
            scrapedAt: new Date().toISOString(),
          }
        );

        result.embeddingsCreated = embeddingResult.chunksSaved;
        result.embeddingsSkipped = embeddingResult.chunksSkipped;
        result.costSavings =
          embeddingResult.chunksCreated > 0
            ? Math.round(
                (embeddingResult.chunksSkipped /
                  embeddingResult.chunksCreated) *
                  100
              )
            : 0;

        // Detect repetitive content
        if (result.costSavings > 50) {
          result.edgeCases.hadRepetitiveContent = true;
          result.recommendations.push(
            "High level of repetitive content detected - consider improving content filtering"
          );
        }
      } catch (error) {
        result.errors.push({
          type: "EMBEDDING_GENERATION_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          context: { pageUrl: firstPage.url },
        });
        throw error;
      }

      // Step 4: Generate recommendations
      this.generateRecommendations(result);

      result.success = true;
      console.log("✅ Test completed successfully\n");
    } catch (error) {
      result.errors.push({
        type: "TEST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      console.error("❌ Test failed:", error);
    }

    result.duration = Date.now() - startTime;

    // Print detailed result
    this.printDetailedResult(result);

    return result;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(result: DetailedTestResult): void {
    // Quality recommendations
    if (result.averageQuality < 40) {
      result.recommendations.push(
        "Average quality is low - consider adjusting quality thresholds or improving content parser"
      );
    }

    // Word count recommendations
    if (result.averageWordCount < 200) {
      result.recommendations.push(
        "Low word count per page - may indicate parsing issues or genuinely minimal content"
      );
    }

    // Scraper recommendations
    if (
      result.scraperUsed === "axios" &&
      result.edgeCases.hadJavaScriptContent
    ) {
      result.recommendations.push(
        "Consider using browser-based scraping for this site to capture JavaScript-rendered content"
      );
    }

    // Pages expectation
    if (!result.pagesMetExpectation) {
      result.recommendations.push(
        "Fewer pages scraped than expected - check if site has access restrictions or unusual navigation"
      );
    }

    // Success recommendation
    if (
      result.success &&
      result.pagesScraped > 0 &&
      result.averageQuality >= 40
    ) {
      result.recommendations.push(
        "✓ Site scraped successfully with good quality content"
      );
    }
  }

  /**
   * Print detailed test result
   */
  private printDetailedResult(result: DetailedTestResult): void {
    console.log(`\n${"-".repeat(70)}`);
    console.log(`TEST RESULT: ${result.url}`);
    console.log(`${"-".repeat(70)}`);
    console.log(`Status: ${result.success ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Tech Stack: ${result.techStack} (${result.renderingType})`);
    console.log(`Scraper Used: ${result.scraperUsed}`);
    console.log(`\nPages:`);
    console.log(
      `  Scraped: ${result.pagesScraped}/${result.expectedPages} expected`
    );
    console.log(`  Met Expectation: ${result.pagesMetExpectation ? "✓" : "✗"}`);
    console.log(`\nContent Quality:`);
    console.log(`  Total Words: ${result.totalWords.toLocaleString()}`);
    console.log(`  Average Quality: ${result.averageQuality.toFixed(1)}/100`);
    console.log(`  Avg Words/Page: ${result.averageWordCount.toFixed(0)}`);
    console.log(`\nEmbeddings:`);
    console.log(`  Created: ${result.embeddingsCreated}`);
    console.log(`  Skipped: ${result.embeddingsSkipped}`);
    console.log(`  Cost Savings: ~${result.costSavings}%`);
    console.log(`\nPerformance:`);
    console.log(`  Total Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(
      `  Avg Time/Page: ${(result.averagePageTime / 1000).toFixed(2)}s`
    );

    if (Object.values(result.edgeCases).some((v) => v)) {
      console.log(`\n⚠️  Edge Cases Detected:`);
      if (result.edgeCases.hadJavaScriptContent)
        console.log("  • JavaScript-rendered content");
      if (result.edgeCases.hadMinimalContent)
        console.log("  • Minimal content on some pages");
      if (result.edgeCases.hadRepetitiveContent)
        console.log("  • Repetitive content");
      if (result.edgeCases.hadUnusualStructure)
        console.log("  • Unusual HTML structure");
      if (result.edgeCases.hadBlockingMechanisms)
        console.log("  • Possible blocking mechanisms");
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.slice(0, 3).forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
      if (result.warnings.length > 3) {
        console.log(`  ... and ${result.warnings.length - 3} more`);
      }
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. [${error.type}] ${error.message}`);
      });
    }

    if (result.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log(`${"-".repeat(70)}\n`);
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<DetailedTestResult[]> {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 COMPREHENSIVE CONTENT PARSER TEST SUITE");
    console.log(
      `Testing ${COMPREHENSIVE_TEST_WEBSITES.length} websites with different tech stacks`
    );
    console.log("=".repeat(70));

    const results: DetailedTestResult[] = [];

    for (let i = 0; i < COMPREHENSIVE_TEST_WEBSITES.length; i++) {
      const testCase = COMPREHENSIVE_TEST_WEBSITES[i];
      console.log(
        `\n[${i + 1}/${COMPREHENSIVE_TEST_WEBSITES.length}] ${
          testCase.description
        }`
      );

      const result = await this.testWebsite(testCase);
      results.push(result);
      this.testResults.push(result);

      // Wait between tests to be respectful
      if (i < COMPREHENSIVE_TEST_WEBSITES.length - 1) {
        console.log("⏳ Waiting 3 seconds before next test...\n");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Generate comprehensive summary
    this.printComprehensiveSummary(results);

    // Save results to file/database
    await this.saveTestResults(results);

    return results;
  }

  /**
   * Print comprehensive summary
   */
  private printComprehensiveSummary(results: DetailedTestResult[]): void {
    console.log("\n" + "=".repeat(70));
    console.log("📊 COMPREHENSIVE TEST SUMMARY");
    console.log("=".repeat(70));

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalPages = results.reduce((sum, r) => sum + r.pagesScraped, 0);
    const totalWords = results.reduce((sum, r) => sum + r.totalWords, 0);
    const avgQuality =
      results.reduce((sum, r) => sum + r.averageQuality, 0) / results.length;
    const totalEmbeddings = results.reduce(
      (sum, r) => sum + r.embeddingsCreated,
      0
    );
    const totalSkipped = results.reduce(
      (sum, r) => sum + r.embeddingsSkipped,
      0
    );
    const avgCostSavings =
      results.reduce((sum, r) => sum + r.costSavings, 0) / results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 Overall Statistics:`);
    console.log(`  Total Tests: ${results.length}`);
    console.log(`  Successful: ${successful} ✅`);
    console.log(`  Failed: ${failed} ❌`);
    console.log(
      `  Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`
    );

    console.log(`\n📄 Content Analysis:`);
    console.log(`  Total Pages: ${totalPages}`);
    console.log(`  Total Words: ${totalWords.toLocaleString()}`);
    console.log(`  Average Quality: ${avgQuality.toFixed(1)}/100`);

    console.log(`\n🧠 Embedding Optimization:`);
    console.log(`  Embeddings Created: ${totalEmbeddings}`);
    console.log(`  Embeddings Skipped: ${totalSkipped}`);
    console.log(`  Average Cost Savings: ~${avgCostSavings.toFixed(1)}%`);

    console.log(`\n⏱️  Performance:`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(
      `  Average per Test: ${(totalDuration / results.length / 1000).toFixed(
        2
      )}s`
    );

    // Tech stack breakdown
    console.log(`\n🔧 Tech Stack Breakdown:`);
    const techStacks = new Map<string, number>();
    results.forEach((r) => {
      techStacks.set(
        r.renderingType,
        (techStacks.get(r.renderingType) || 0) + 1
      );
    });
    techStacks.forEach((count, type) => {
      console.log(`  ${type}: ${count} tests`);
    });

    // Edge cases summary
    const edgeCasesSummary = {
      javascript: results.filter((r) => r.edgeCases.hadJavaScriptContent)
        .length,
      minimal: results.filter((r) => r.edgeCases.hadMinimalContent).length,
      repetitive: results.filter((r) => r.edgeCases.hadRepetitiveContent)
        .length,
      unusual: results.filter((r) => r.edgeCases.hadUnusualStructure).length,
      blocking: results.filter((r) => r.edgeCases.hadBlockingMechanisms).length,
    };

    console.log(`\n⚠️  Edge Cases Encountered:`);
    console.log(`  JavaScript Content: ${edgeCasesSummary.javascript} sites`);
    console.log(`  Minimal Content: ${edgeCasesSummary.minimal} sites`);
    console.log(`  Repetitive Content: ${edgeCasesSummary.repetitive} sites`);
    console.log(`  Unusual Structure: ${edgeCasesSummary.unusual} sites`);
    console.log(`  Blocking Mechanisms: ${edgeCasesSummary.blocking} sites`);

    console.log("\n" + "=".repeat(70));
  }

  /**
   * Save test results for documentation
   */
  private async saveTestResults(results: DetailedTestResult[]): Promise<void> {
    const timestamp = new Date().toISOString();
    const summary = {
      testRun: timestamp,
      totalTests: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => r.success).length,
      results: results,
    };

    // Save to a JSON file for documentation
    console.log("\n💾 Test results saved for documentation");
    console.log(`   Timestamp: ${timestamp}`);

    // You can also save to Supabase or a file here
    // Example: fs.writeFileSync(`test-results-${timestamp}.json`, JSON.stringify(summary, null, 2));
  }
}

// Export test runner
export async function runComprehensiveTests() {
  const tester = new ComprehensiveTester();
  return await tester.runAllTests();
}
