// lib/services/scraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { config } from "../config";

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  links: string[];
}

/**
 * Efficient Queue implementation using index pointer
 */
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

    // Periodically clean up the array to prevent memory leaks
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

  constructor(baseUrl: string, maxPages: number = config.ingestion.maxPages) {
    this.baseUrl = this.normalizeUrl(baseUrl);
    this.maxPages = maxPages;
    this.baseHostname = new URL(this.baseUrl).hostname;
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
   * Extract main content from page
   */
  private extractContent($: cheerio.Root): string {
    // Remove unwanted elements
    $("script, style, nav, footer, iframe, noscript, header, aside").remove();

    let mainContent = "";

    // Priority order for content extraction
    const contentSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      ".main-content",
      "#content",
      "#main",
      "body",
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }

    // Clean up whitespace
    const cleaned = mainContent
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim();

    // Return up to maxContentLength characters
    return cleaned.substring(0, config.ingestion.maxContentLength);
  }

  /**
   * Extract links from page
   */
  private extractLinks($: cheerio.Root): string[] {
    const links: string[] = [];
    const seenLinks = new Set<string>();

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, this.baseUrl).href;

          // Only add if valid, not visited, and not already in list
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
    });

    return links;
  }

  /**
   * Scrape a single page
   */
  async scrapePage(url: string): Promise<ScrapedPage | null> {
    if (this.visited.has(url) || this.visited.size >= this.maxPages) {
      return null;
    }

    this.visited.add(url);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "WebRep-Bot/1.0",
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);
      const title = $("title").text().trim() || "Untitled Page";
      const content = this.extractContent($);
      const links = this.extractLinks($);

      return {
        url,
        title,
        content,
        links,
      };
    } catch (error) {
      console.error(
        `Error scraping ${url}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /**
   * Scrape website with optimized BFS
   * Time complexity: O(V + E) where V = pages, E = links
   */
  async scrapeWebsite(): Promise<ScrapedPage[]> {
    const pages: ScrapedPage[] = [];
    const queue = new Queue<string>();
    queue.enqueue(this.baseUrl);

    // Track URLs in queue to avoid duplicates
    const inQueue = new Set<string>([this.baseUrl]);

    while (!queue.isEmpty() && pages.length < this.maxPages) {
      const url = queue.dequeue();
      if (!url) break;

      console.log(
        `Scraping: ${url} (${pages.length + 1}/${
          this.maxPages
        } pages collected)`
      );

      const page = await this.scrapePage(url);

      if (page) {
        pages.push(page);

        // Add new links to queue (O(1) per link)
        for (const link of page.links) {
          if (!inQueue.has(link) && !this.visited.has(link)) {
            queue.enqueue(link);
            inQueue.add(link);
          }
        }
      }

      // Small delay to be respectful to the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`✓ Scraped ${pages.length} pages from ${this.baseUrl}`);
    return pages;
  }

  /**
   * Get scraping statistics
   */
  getStats(): {
    pagesScraped: number;
    pagesVisited: number;
    maxPages: number;
  } {
    return {
      pagesScraped: this.visited.size,
      pagesVisited: this.visited.size,
      maxPages: this.maxPages,
    };
  }
}
