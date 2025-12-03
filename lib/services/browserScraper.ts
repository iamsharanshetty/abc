// lib/services/browserScraper.ts - IMPROVED VERSION
import puppeteer, { Browser, Page } from "puppeteer";
import { ContentParser, ParsedContent } from "./contentParser";
import { config } from "../config";

export interface BrowserScrapedPage {
  url: string;
  title: string;
  content: string;
  parsedContent: ParsedContent;
  links: string[];
  qualityScore: number;
}

export class BrowserScraper {
  private visited: Set<string> = new Set();
  private maxPages: number;
  private baseUrl: string;
  private baseHostname: string;
  private contentParser: ContentParser;
  private minQualityScore: number = 20; // Lowered from 30
  private browser: Browser | null = null;

  constructor(baseUrl: string, maxPages: number = config.ingestion.maxPages) {
    this.baseUrl = this.normalizeUrl(baseUrl);
    this.maxPages = maxPages;
    this.baseHostname = new URL(this.baseUrl).hostname;
    this.contentParser = new ContentParser();
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (error) {
      throw new Error(`Invalid URL provided: ${url}`);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === this.baseHostname;
    } catch {
      return false;
    }
  }

  /**
   * Initialize browser with better stealth configuration
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    console.log("🚀 Launching browser...");

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
      ],
    });

    return this.browser;
  }

  /**
   * Configure page with stealth settings
   */
  private async configurePage(page: Page): Promise<void> {
    // Ignore HTTPS errors
    await page.setBypassCSP(true);

    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // Add realistic browser properties
    await page.evaluateOnNewDocument(() => {
      (window.navigator as any).chrome = {
        runtime: {},
      };
    });

    // Set extra headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });
  }

  /**
   * Scrape a single page using Puppeteer with improved error handling
   */
  async scrapePage(url: string): Promise<BrowserScrapedPage | null> {
    if (this.visited.has(url) || this.visited.size >= this.maxPages) {
      return null;
    }

    this.visited.add(url);
    let page: Page | null = null;

    try {
      console.log(`🌐 Fetching with browser: ${url}`);

      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Configure page with stealth settings
      await this.configurePage(page);

      // Navigate with longer timeout and better waiting strategy
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded", // Changed from networkidle2 for faster loading
          timeout: 30000,
        });
      } catch (navError) {
        console.warn(
          `⚠️ Navigation timeout, but page may have loaded partially`
        );
      }

      // Wait for content to appear with multiple strategies
      // Wait for content to appear with multiple strategies
      await Promise.race([
        page.waitForSelector("body", { timeout: 10000 }),
        page.waitForFunction("document.body.innerText.length > 100", {
          timeout: 10000,
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]).catch(() => {
        console.warn("⚠️ Content wait timeout, proceeding anyway");
      });

      // Additional wait for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get the HTML after JavaScript execution
      const html = await page.content();

      console.log(`  ✓ Browser fetch complete`);
      console.log(`  HTML Length: ${html.length} characters`);

      // Check if we got meaningful content
      if (html.length < 1000) {
        console.warn(`  ⚠️ Very short HTML response (${html.length} chars)`);
      }

      // Extract visible text to check if page loaded properly
      const visibleText = await page.evaluate(
        () => document.body.innerText || document.body.textContent || ""
      );
      console.log(
        `  📝 Visible text preview: "${visibleText
          .substring(0, 200)
          .replace(/\s+/g, " ")}..."`
      );
      console.log(`  📊 Visible Text Length: ${visibleText.length} characters`);

      if (visibleText.length < 100) {
        console.warn(
          `  ⚠️ Very little visible text - page may not have loaded properly`
        );
      }

      // Extract all links on the page
      const links = await page.evaluate((baseHostname) => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        return anchors
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((href) => {
            try {
              const url = new URL(href);
              return url.hostname === baseHostname;
            } catch {
              return false;
            }
          });
      }, this.baseHostname);

      await page.close();

      // Parse content
      const parsedContent = this.contentParser.parse(html, url);

      // If parsing failed, use visible text directly
      if (parsedContent.metadata.wordCount === 0 && visibleText.length > 100) {
        console.log(
          `  ⚠️ HTML parsing returned 0 words, using visible text directly`
        );

        // Override with visible text
        const cleanText = visibleText.replace(/\s+/g, " ").trim();
        const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

        parsedContent.mainContent = cleanText;
        parsedContent.metadata.wordCount = words.length;
        parsedContent.metadata.uniqueWordRatio =
          new Set(words.map((w) => w.toLowerCase())).size / words.length;

        console.log(`  ✓ Using ${words.length} words from visible text`);
      }

      const qualityScore =
        this.contentParser.calculateQualityScore(parsedContent);

      console.log(
        `✓ Parsed ${url} - Quality: ${qualityScore}/100 - Words: ${parsedContent.metadata.wordCount}`
      );

      // If quality is very low, it might be blocked
      if (qualityScore < 20 && visibleText.length < 200) {
        console.warn(
          `  ⚠️ Site appears to be blocking scraper or content didn't load`
        );
      }

      return {
        url,
        title: parsedContent.title,
        content: parsedContent.mainContent,
        parsedContent,
        links: links.filter((link) => !this.visited.has(link)),
        qualityScore,
      };
    } catch (error) {
      if (page) {
        await page.close().catch(() => {});
      }

      console.error(
        `✗ Error scraping ${url}:`,
        error instanceof Error ? error.message : error
      );

      // Log more details about the error
      if (error instanceof Error) {
        console.error(`  Error type: ${error.name}`);
        console.error(`  Error stack: ${error.stack?.split("\n")[0]}`);
      }

      return null;
    }
  }

  /**
   * Scrape entire website using browser
   */
  async scrapeWebsite(): Promise<BrowserScrapedPage[]> {
    const pages: BrowserScrapedPage[] = [];
    const queue: string[] = [this.baseUrl];
    const inQueue = new Set<string>([this.baseUrl]);
    let skippedLowQuality = 0;

    try {
      while (queue.length > 0 && pages.length < this.maxPages) {
        const url = queue.shift();
        if (!url) break;

        console.log(
          `\n[${pages.length + 1}/${this.maxPages}] Processing: ${url}`
        );

        const page = await this.scrapePage(url);

        if (page) {
          if (page.qualityScore >= this.minQualityScore) {
            pages.push(page);
            console.log(`  ✓ Added (quality: ${page.qualityScore})`);

            // Add new links to queue
            for (const link of page.links) {
              if (!inQueue.has(link) && !this.visited.has(link)) {
                queue.push(link);
                inQueue.add(link);
              }
            }
          } else {
            skippedLowQuality++;
            console.log(`  ✗ Skipped (low quality: ${page.qualityScore})`);
          }
        }

        // Rate limiting between pages
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log(`\n✓ Browser scraping complete:`);
      console.log(`  - Pages collected: ${pages.length}`);
      console.log(`  - Pages visited: ${this.visited.size}`);
      console.log(`  - Low quality skipped: ${skippedLowQuality}`);
    } finally {
      // Always close the browser
      await this.closeBrowser();
    }

    return pages;
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log("🔒 Closing browser...");
      await this.browser.close().catch((err) => {
        console.error("Error closing browser:", err);
      });
      this.browser = null;
    }
  }

  getStats() {
    return {
      pagesScraped: this.visited.size,
      pagesVisited: this.visited.size,
      maxPages: this.maxPages,
      minQualityScore: this.minQualityScore,
    };
  }
}
