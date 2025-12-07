// lib/services/scraper.ts - IMPROVED VERSION
import axios from "axios";
import { config } from "../config";
import { ContentParser, ParsedContent } from "./contentParser";

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  parsedContent: ParsedContent;
  links: string[];
  qualityScore: number;
}

class Queue<T> {
  private items: T[] = [];
  private head = 0;

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this.items[this.head];
    this.head++;

    if (this.head > 100) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }

    return item;
  }

  isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  get length(): number {
    return this.items.length - this.head;
  }
}

export class WebScraper {
  private visited: Set<string> = new Set();
  private maxPages: number;
  private baseUrl: string;
  private baseHostname: string;
  private contentParser: ContentParser;
  private minQualityScore: number = config.ingestion.minQualityScore; // Lowered from 30

  constructor(baseUrl: string, maxPages: number = config.ingestion.maxPages) {
    this.baseUrl = this.normalizeUrl(baseUrl);
    this.maxPages = maxPages;
    this.baseHostname = new URL(this.baseUrl).hostname;
    this.contentParser = new ContentParser();
  }

  /**
   * Normalize URL to base domain
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (error) {
      throw new Error(`Invalid URL provided: ${url}`);
    }
  }

  /**
   * Check if URL belongs to same domain
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === this.baseHostname;
    } catch {
      return false;
    }
  }

  /**
   * Extract links from HTML (excluding anchors and hash links)
   */
  private extractLinks(html: string): string[] {
    const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    const links: string[] = [];
    const seenLinks = new Set<string>();

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      try {
        const absoluteUrl = new URL(url, this.baseUrl).href;
        const urlWithoutHash = absoluteUrl.split("#")[0];
        const baseWithoutHash = this.baseUrl.split("#")[0];

        if (urlWithoutHash === baseWithoutHash) {
          continue;
        }

        if (
          this.isValidUrl(absoluteUrl) &&
          !this.visited.has(absoluteUrl) &&
          !seenLinks.has(absoluteUrl)
        ) {
          links.push(absoluteUrl);
          seenLinks.add(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return links;
  }

  /**
   * Scrape a single page with intelligent parsing
   */
  async scrapePage(url: string): Promise<ScrapedPage | null> {
    if (this.visited.has(url) || this.visited.size >= this.maxPages) {
      return null;
    }

    this.visited.add(url);

    try {
      console.log(`Fetching: ${url}`);

      const response = await axios.get(url, {
        timeout: 20000, // Increased timeout
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          // Add more headers to appear more like a real browser
          "Cache-Control": "max-age=0",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      const html = response.data;

      // More detailed logging
      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${response.headers["content-type"]}`);
      console.log(`  HTML Length: ${html.length} characters`);

      // Check if we got valid HTML
      if (!html || typeof html !== "string" || html.length < 100) {
        console.error(`✗ Invalid response from ${url}`);
        return null;
      }

      // Check for error pages or redirects
      if (response.status !== 200) {
        console.error(`✗ Status ${response.status} from ${url}`);
        return null;
      }

      // Check for JavaScript-rendered content indicators
      const hasVeryLittleText =
        html.replace(/<[^>]*>/g, "").trim().length < 500;
      const hasReactRoot =
        html.includes('id="root"') || html.includes('id="__next"');
      const hasVueApp = html.includes('id="app"');

      if (hasVeryLittleText && (hasReactRoot || hasVueApp)) {
        console.warn(`  ⚠️  Possible JavaScript-rendered site detected`);
        console.warn(
          `  ⚠️  HTML has minimal text content - may need browser-based scraping`
        );
      }

      // Parse content intelligently
      const parsedContent = this.contentParser.parse(html, url);

      // Calculate quality score
      const qualityScore =
        this.contentParser.calculateQualityScore(parsedContent);

      // Extract links for crawling
      const links = this.extractLinks(html);

      console.log(
        `✓ Parsed ${url} - Quality: ${qualityScore}/100 - Words: ${parsedContent.metadata.wordCount}`
      );

      // Log warning if quality is very low
      if (qualityScore < 30) {
        console.warn(
          `  ⚠️  Very low quality score - content may not have loaded properly`
        );
      }

      // Special handling for single-page sites
      if (links.length === 0 && this.visited.size === 1) {
        console.log(
          "  ℹ️  No additional pages found - this appears to be a single-page site"
        );
      }

      return {
        url,
        title: parsedContent.title,
        content: parsedContent.mainContent,
        parsedContent,
        links,
        qualityScore,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`✗ Axios error scraping ${url}:`);
        console.error(`  Code: ${error.code}`);
        console.error(`  Message: ${error.message}`);
        if (error.response) {
          console.error(`  Status: ${error.response.status}`);
        }
      } else {
        console.error(
          `✗ Error scraping ${url}:`,
          error instanceof Error ? error.message : error
        );
      }
      return null;
    }
  }

  /**
   * Scrape website with quality filtering
   */
  async scrapeWebsite(): Promise<ScrapedPage[]> {
    const pages: ScrapedPage[] = [];
    const queue = new Queue<string>();
    queue.enqueue(this.baseUrl);

    const inQueue = new Set<string>([this.baseUrl]);
    let skippedLowQuality = 0;

    while (!queue.isEmpty() && pages.length < this.maxPages) {
      const url = queue.dequeue();
      if (!url) break;

      console.log(
        `\n[${pages.length + 1}/${this.maxPages}] Processing: ${url}`
      );

      const page = await this.scrapePage(url);

      if (page) {
        // Check quality threshold
        if (page.qualityScore >= this.minQualityScore) {
          pages.push(page);
          console.log(`  ✓ Added to queue (quality: ${page.qualityScore})`);

          // Add new links to queue
          for (const link of page.links) {
            if (!inQueue.has(link) && !this.visited.has(link)) {
              queue.enqueue(link);
              inQueue.add(link);
            }
          }
        } else {
          skippedLowQuality++;
          console.log(
            `  ✗ Skipped (low quality: ${page.qualityScore}, threshold: ${this.minQualityScore})`
          );
        }
      }

      // Rate limiting - be respectful to servers
      await new Promise((resolve) =>
        setTimeout(resolve, config.scraping.pageWaitTime)
      ); // Increased delay
    }

    console.log(`\n✓ Scraping complete:`);
    console.log(`  - Pages collected: ${pages.length}`);
    console.log(`  - Pages visited: ${this.visited.size}`);
    console.log(`  - Low quality skipped: ${skippedLowQuality}`);

    // Warning if no pages collected
    if (pages.length === 0) {
      console.log("\n⚠️  No pages collected. Possible reasons:");
      console.log("  1. All pages were below quality threshold");
      console.log(
        "  2. Content could not be parsed (may be JavaScript-rendered)"
      );
      console.log("  3. Site structure is unusual");
      console.log("  4. Site may be blocking automated requests");
      console.log("\n💡 Suggestions:");
      console.log(
        "  - Try the debug endpoint: /api/debug-scraper?url=YOUR_URL"
      );
      console.log(
        "  - Check if the site uses client-side rendering (React, Vue, etc.)"
      );
      console.log("  - Consider using Puppeteer for JavaScript-rendered sites");
    }

    return pages;
  }

  /**
   * Get scraping statistics
   */
  getStats(): {
    pagesScraped: number;
    pagesVisited: number;
    maxPages: number;
    minQualityScore: number;
  } {
    return {
      pagesScraped: this.visited.size,
      pagesVisited: this.visited.size,
      maxPages: this.maxPages,
      minQualityScore: this.minQualityScore,
    };
  }
}
