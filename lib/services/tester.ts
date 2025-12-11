//Created this file for testing
import { WebScraper } from "./scraper";
import { EmbeddingService } from "./embeddings";

/**
 * Test websites with different tech stacks
 */
export const TEST_WEBSITES = [
  {
    url: "https://blog.cloudflare.com",
    techStack: "Custom CMS",
    description: "Tech blog with articles",
  },
  {
    url: "https://stripe.com/docs",
    techStack: "Documentation site",
    description: "Technical documentation",
  },
  {
    url: "https://example.com",
    techStack: "Simple HTML",
    description: "Basic static site",
  },
  {
    url: "https://tailwindcss.com",
    techStack: "Modern framework",
    description: "Documentation with examples",
  },
  {
    url: "https://nodejs.org",
    techStack: "Node.js site",
    description: "Official Node.js website",
  },
];

export interface TestResult {
  url: string;
  techStack: string;
  success: boolean;
  pagesScraped: number;
  totalWords: number;
  averageQuality: number;
  embeddingsCreated: number;
  embeddingsSkipped: number;
  costSavings: number;
  errors: string[];
  duration: number;
}

export class ContentTester {
  /**
   * Test a single website
   */
  async testWebsite(testCase: (typeof TEST_WEBSITES)[0]): Promise<TestResult> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing: ${testCase.url}`);
    console.log(`Tech Stack: ${testCase.techStack}`);
    console.log(`${"=".repeat(60)}\n`);

    const startTime = Date.now();
    const result: TestResult = {
      url: testCase.url,
      techStack: testCase.techStack,
      success: false,
      pagesScraped: 0,
      totalWords: 0,
      averageQuality: 0,
      embeddingsCreated: 0,
      embeddingsSkipped: 0,
      costSavings: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Step 1: Scrape website (limit to 3 pages for testing)
      const scraper = new WebScraper(testCase.url, 3);
      const pages = await scraper.scrapeWebsite();

      result.pagesScraped = pages.length;

      if (pages.length === 0) {
        result.errors.push("No pages scraped");
        return result;
      }

      // Calculate statistics
      let totalQuality = 0;
      let totalWords = 0;

      for (const page of pages) {
        totalQuality += page.qualityScore;
        totalWords += page.parsedContent.metadata.wordCount;
      }

      result.averageQuality = totalQuality / pages.length;
      result.totalWords = totalWords;

      // Step 2: Generate embeddings (for first page only in test)
      const embeddingService = new EmbeddingService();
      const firstPage = pages[0];

      console.log(`\nGenerating embeddings for: ${firstPage.url}`);
      const embeddingResult = await embeddingService.storeEmbeddings(
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
              (embeddingResult.chunksSkipped / embeddingResult.chunksCreated) *
                100
            )
          : 0;

      result.success = true;
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(`Error testing ${testCase.url}:`, error);
    }

    result.duration = Date.now() - startTime;

    // Print summary
    this.printTestResult(result);

    return result;
  }

  /**
   * Test all websites
   */
  async testAll(): Promise<TestResult[]> {
    console.log("\n" + "=".repeat(60));
    console.log("STARTING CONTENT PARSER TEST SUITE");
    console.log("=".repeat(60));

    const results: TestResult[] = [];

    for (const testCase of TEST_WEBSITES) {
      const result = await this.testWebsite(testCase);
      results.push(result);

      // Wait between tests to be respectful
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Print overall summary
    this.printOverallSummary(results);

    return results;
  }

  /**
   * Print individual test result
   */
  private printTestResult(result: TestResult): void {
    console.log(`\n${"-".repeat(60)}`);
    console.log(`TEST RESULT: ${result.url}`);
    console.log(`${"-".repeat(60)}`);
    console.log(`Status: ${result.success ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`Tech Stack: ${result.techStack}`);
    console.log(`Pages Scraped: ${result.pagesScraped}`);
    console.log(`Total Words: ${result.totalWords.toLocaleString()}`);
    console.log(`Average Quality: ${result.averageQuality.toFixed(1)}/100`);
    console.log(`Embeddings Created: ${result.embeddingsCreated}`);
    console.log(`Embeddings Skipped: ${result.embeddingsSkipped}`);
    console.log(`Cost Savings: ~${result.costSavings}%`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);

    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    console.log(`${"-".repeat(60)}\n`);
  }

  /**
   * Print overall summary
   */
  private printOverallSummary(results: TestResult[]): void {
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

    console.log("\n" + "=".repeat(60));
    console.log("OVERALL TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${results.length}`);
    console.log(`Successful: ${successful} ✓`);
    console.log(`Failed: ${failed} ✗`);
    console.log(
      `Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`
    );
    console.log(`\nContent Analysis:`);
    console.log(`  Total Pages: ${totalPages}`);
    console.log(`  Total Words: ${totalWords.toLocaleString()}`);
    console.log(`  Average Quality: ${avgQuality.toFixed(1)}/100`);
    console.log(`\nEmbedding Optimization:`);
    console.log(`  Embeddings Created: ${totalEmbeddings}`);
    console.log(`  Embeddings Skipped: ${totalSkipped}`);
    console.log(`  Average Cost Savings: ~${avgCostSavings.toFixed(1)}%`);
    console.log("=".repeat(60) + "\n");
  }
}

// Export a simple test runner
export async function runTests() {
  const tester = new ContentTester();
  return await tester.testAll();
}
