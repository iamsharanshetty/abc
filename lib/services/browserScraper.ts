// lib/services/browserScraper.ts - IMPROVED VERSION
import puppeteer, { Browser, Page } from "puppeteer";
import { ContentParser, ParsedContent } from "./contentParser";
import { config } from "../config";
import { logger } from "@/lib/utils/logger";

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
  private minQualityScore: number = config.ingestion.minQualityScore; // Lowered from 30
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
      logger.debug("Fetching with browser", { url });

      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Configure page with stealth settings
      await this.configurePage(page);

      // Navigate with longer timeout
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: config.scraping.browserTimeout,
        });
      } catch (navError) {
        logger.warn("Navigation timeout, but page may have loaded partially", {
          url,
        });
      }

      // Wait for content
      await Promise.race([
        page.waitForSelector("body", { timeout: 10000 }),
        page.waitForFunction("document.body.innerText.length > 100", {
          timeout: 10000,
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]).catch(() => {
        logger.warn("Content wait timeout, proceeding anyway", { url });
      });

      // Additional wait for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get the HTML after JavaScript execution
      const html = await page.content();

      logger.debug("Browser fetch complete", { url, htmlLength: html.length });

      // Extract visible text
      const visibleText = await page.evaluate(
        () => document.body.innerText || document.body.textContent || ""
      );

      logger.debug("Visible text extracted", {
        url,
        textLength: visibleText.length,
      });

      if (visibleText.length < 100) {
        logger.warn(
          "Very little visible text - page may not have loaded properly",
          { url }
        );
      }

      // Extract all links
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

      // Close the page before processing content
      await page.close();
      page = null; // Clear reference

      // Parse content
      const parsedContent = this.contentParser.parse(html, url);

      // If parsing failed, use visible text directly
      if (parsedContent.metadata.wordCount === 0 && visibleText.length > 100) {
        logger.debug(
          "HTML parsing returned 0 words, using visible text directly",
          { url }
        );

        const cleanText = visibleText.replace(/\s+/g, " ").trim();
        const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

        parsedContent.mainContent = cleanText;
        parsedContent.metadata.wordCount = words.length;
        parsedContent.metadata.uniqueWordRatio =
          new Set(words.map((w) => w.toLowerCase())).size / words.length;

        logger.debug("Using visible text", { url, wordCount: words.length });
      }

      const qualityScore =
        this.contentParser.calculateQualityScore(parsedContent);

      logger.info("Parsed page", {
        url,
        quality: qualityScore,
        words: parsedContent.metadata.wordCount,
      });

      return {
        url,
        title: parsedContent.title,
        content: parsedContent.mainContent,
        parsedContent,
        links: links.filter((link) => !this.visited.has(link)),
        qualityScore,
      };
    } catch (error) {
      logger.error("Error scraping page", { url, error });
      return null;
    } finally {
      // CRITICAL: Always close the page, even if errors occurred
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          logger.error("Error closing page", { url, error: closeError });
        }
      }
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
      // Initialize browser at the start
      await this.initBrowser();

      while (queue.length > 0 && pages.length < this.maxPages) {
        const url = queue.shift();
        if (!url) break;

        logger.info(`Processing page ${pages.length + 1}/${this.maxPages}`, {
          url,
        });

        try {
          const page = await this.scrapePage(url);

          if (page) {
            if (page.qualityScore >= this.minQualityScore) {
              pages.push(page);
              logger.debug("Added page", { url, quality: page.qualityScore });

              // Add new links to queue
              for (const link of page.links) {
                if (!inQueue.has(link) && !this.visited.has(link)) {
                  queue.push(link);
                  inQueue.add(link);
                }
              }
            } else {
              skippedLowQuality++;
              logger.debug("Skipped page (low quality)", {
                url,
                quality: page.qualityScore,
              });
            }
          }
        } catch (error) {
          logger.error("Error scraping page", { url, error });
          // Continue with next page instead of failing entire operation
        }

        // Rate limiting between pages
        await new Promise((resolve) =>
          setTimeout(resolve, config.scraping.pageWaitTime)
        );
      }

      logger.info("Browser scraping complete", {
        pagesCollected: pages.length,
        pagesVisited: this.visited.size,
        skippedLowQuality,
      });

      return pages;
    } catch (error) {
      logger.error("Browser scraping failed", { error });
      throw error;
    } finally {
      // CRITICAL: Always close the browser, even if errors occurred
      await this.closeBrowser();
    }
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
