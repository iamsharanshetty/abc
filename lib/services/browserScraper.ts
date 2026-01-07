// lib/services/browserScraper.ts - PRODUCTION READY FOR LOCAL + VERCEL
import puppeteer, { Browser, Page } from "puppeteer-core";
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
  private originalUrl: string; // ✅ NEW: Preserve original URL with path
  private baseHostname: string;
  private contentParser: ContentParser;
  private minQualityScore: number = config.ingestion.minQualityScore;
  private browser: Browser | null = null;

  constructor(baseUrl: string, maxPages: number = config.ingestion.maxPages) {
    this.originalUrl = baseUrl; // ✅ NEW: Store original URL
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
      // Ignore hash-only links (same page anchors)
      if (urlObj.hash && urlObj.pathname === new URL(this.baseUrl).pathname) {
        return false;
      }
      return urlObj.hostname === this.baseHostname;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL by removing hash fragments
   */
  private normalizePageUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove hash to avoid treating anchors as different pages
      urlObj.hash = "";
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Detect if running in serverless environment
   */
  private isServerlessEnvironment(): boolean {
    return !!(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_VERSION ||
      process.env.TRIGGER_ENV ||
      process.env.AWS_EXECUTION_ENV
    );
  }

  /**
   * Get Chrome configuration based on environment
   */
  private async getChromeConfig(): Promise<{
    executablePath?: string;
    args: string[];
  }> {
    const baseArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--window-size=1920,1080",
      "--disable-gpu",
    ];

    // Serverless environment (Vercel, AWS Lambda, Trigger.dev)
    if (this.isServerlessEnvironment()) {
      logger.info("☁️  Serverless environment detected");

      try {
        const chromium = await import("@sparticuz/chromium");
        const executablePath = await chromium.default.executablePath();

        logger.info("Using @sparticuz/chromium", { executablePath });

        return {
          executablePath,
          args: [
            ...baseArgs,
            ...chromium.default.args,
            "--single-process",
            "--no-zygote",
          ],
        };
      } catch (error) {
        logger.error("Failed to load @sparticuz/chromium", { error });
        throw new Error(
          "Running in serverless but @sparticuz/chromium not available. " +
            "Please install: pnpm add @sparticuz/chromium"
        );
      }
    }

    // Local development - use Puppeteer's bundled Chrome
    logger.info("💻 Local environment detected");

    try {
      // Try to get executablePath from puppeteer
      const puppeteerFull = await import("puppeteer");
      const executablePath = puppeteerFull.executablePath();

      logger.info("Using Puppeteer bundled Chrome", { executablePath });

      return {
        executablePath,
        args: baseArgs,
      };
    } catch (error) {
      // Fallback: let puppeteer-core find Chrome
      logger.warn(
        "Could not get Puppeteer executable path, using system Chrome"
      );

      return {
        args: baseArgs,
      };
    }
  }

  /**
   * Initialize browser with environment-aware configuration
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    logger.info("🚀 Launching browser...");

    try {
      const chromeConfig = await this.getChromeConfig();

      const launchOptions: any = {
        headless: true,
        ...chromeConfig,
      };

      this.browser = await puppeteer.launch(launchOptions);
      logger.info("✅ Browser launched successfully");

      return this.browser;
    } catch (error) {
      logger.error("Failed to launch browser", { error });

      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("Could not find Chrome")) {
          throw new Error(
            "Chrome not found. For local development, run:\n" +
              "  npx puppeteer browsers install chrome\n\n" +
              "For Vercel deployment, ensure @sparticuz/chromium is installed:\n" +
              "  pnpm add @sparticuz/chromium"
          );
        }
      }

      throw error;
    }
  }

  /**
   * Configure page with stealth settings
   */
  private async configurePage(page: Page): Promise<void> {
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    await page.evaluateOnNewDocument(() => {
      (window.navigator as any).chrome = {
        runtime: {},
      };
    });

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
    // Normalize URL to remove hash fragments
    const normalizedUrl = this.normalizePageUrl(url);

    if (this.visited.has(normalizedUrl) || this.visited.size >= this.maxPages) {
      return null;
    }

    this.visited.add(normalizedUrl);
    let page: Page | null = null;

    try {
      logger.debug("Fetching with browser", { url });

      const browser = await this.initBrowser();
      page = await browser.newPage();

      await this.configurePage(page);

      try {
        // ✅ IMPROVED: Use networkidle2 for better SPA support (waits for network to be idle)
        await page.goto(url, {
          waitUntil: "networkidle2", // Wait until network is idle (better for SPAs)
          timeout: config.scraping.browserTimeout,
        });
      } catch (navError) {
        logger.warn("Navigation timeout, trying domcontentloaded fallback", {
          url,
        });
        // Fallback to domcontentloaded if networkidle2 times out
        try {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
        } catch (fallbackError) {
          logger.warn("Fallback navigation also failed, proceeding anyway", {
            url,
          });
        }
      }

      // ✅ IMPROVED: Wait for content to load with multiple strategies
      await Promise.race([
        page.waitForSelector("body", { timeout: 10000 }),
        page.waitForFunction("document.body.innerText.length > 100", {
          timeout: 10000,
        }),
        // Wait for common SPA indicators
        page.waitForFunction(
          "document.querySelector('[data-testid], [class*=\"content\"], main, article') !== null",
          { timeout: 10000 }
        ),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]).catch(() => {
        logger.warn("Content wait timeout, proceeding anyway", { url });
      });

      // ✅ IMPROVED: Wait longer for JavaScript to render content (SPAs need more time)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const html = await page.content();
      logger.debug("Browser fetch complete", { url, htmlLength: html.length });

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

      // ✅ IMPROVED: Extract links with better error handling and logging
      const links = await page.evaluate((baseHostname) => {
        try {
          const anchors = Array.from(document.querySelectorAll("a[href]"));
          
          // ✅ NEW: Log total anchors found for debugging
          console.log(`Found ${anchors.length} anchor elements on page`);
          
          const allLinks = anchors
            .map((a) => {
              try {
                return (a as HTMLAnchorElement).href;
              } catch {
                return null;
              }
            })
            .filter((href): href is string => {
              if (!href) return false;
              // Skip hash-only, javascript:, mailto:, tel: links
              if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
                return false;
              }
              try {
                const url = new URL(href);
                // Remove hash to normalize URLs
                url.hash = "";
                return url.hostname === baseHostname;
              } catch {
                return false;
              }
            })
            .map((href) => {
              // Return normalized URL without hash
              const url = new URL(href);
              url.hash = "";
              return url.toString();
            });
          
          // Remove duplicates
          const uniqueLinks = [...new Set(allLinks)];
          console.log(`Extracted ${uniqueLinks.length} unique links from ${anchors.length} anchors`);
          return uniqueLinks;
        } catch (error) {
          console.error("Error extracting links:", error);
          return [];
        }
      }, this.baseHostname);

      // ✅ NEW: Log discovered links for debugging
      logger.info("Links discovered", {
        url,
        totalLinks: links.length,
        sampleLinks: links.slice(0, 10), // Show first 10 links
      });

      await page.close();
      page = null;

      const parsedContent = this.contentParser.parse(html, url);

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

      // Use normalized URL for consistency
      return {
        url: normalizedUrl,
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
   * ✅ IMPROVED: Start from original URL (preserves path) instead of just base domain
   */
  async scrapeWebsite(): Promise<BrowserScrapedPage[]> {
    const pages: BrowserScrapedPage[] = [];
    // ✅ FIXED: Use original URL (with path) as starting point, fallback to baseUrl
    const startUrl = this.originalUrl || this.baseUrl;
    const queue: string[] = [startUrl];
    const inQueue = new Set<string>([startUrl]);
    let skippedLowQuality = 0;

    try {
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

              // ✅ IMPROVED: Better logging for link discovery
              if (page.links.length > 0) {
                logger.info(`Found ${page.links.length} links on page`, {
                  url,
                  links: page.links.slice(0, 10), // Log first 10 links
                });
              }

              let linksAdded = 0;
              for (const link of page.links) {
                if (!inQueue.has(link) && !this.visited.has(link)) {
                  queue.push(link);
                  inQueue.add(link);
                  linksAdded++;
                }
              }
              
              if (linksAdded > 0) {
                logger.info(`Added ${linksAdded} new links to queue`, {
                  url,
                  queueSize: queue.length,
                });
              } else if (page.links.length > 0) {
                logger.debug("All links already visited or queued", {
                  url,
                  totalLinks: page.links.length,
                });
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
        }

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
      await this.closeBrowser();
    }
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      logger.info("🔒 Closing browser...");
      await this.browser.close().catch((err) => {
        logger.error("Error closing browser:", err);
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
