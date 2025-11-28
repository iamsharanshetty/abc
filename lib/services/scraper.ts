// lib/services/scraper.ts
import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  links: string[];
}

export class WebScraper {
  private visited: Set<string> = new Set();
  private maxPages: number;
  private baseUrl: string;

  constructor(baseUrl: string, maxPages: number = 50) {
    this.baseUrl = this.normalizeUrl(baseUrl);
    this.maxPages = maxPages;
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      throw new Error("Invalid URL provided");
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === new URL(this.baseUrl).hostname;
    } catch {
      return false;
    }
  }

  //   private extractContent($: cheerio.Root): string {
  //     // Remove unwanted elements
  //     $("script, style, nav, footer, iframe, noscript").remove();

  //     // Get main content
  //     const mainContent =
  //       $("main").text() ||
  //       $("article").text() ||
  //       $(".content").text() ||
  //       $("body").text();

  //     // Clean up whitespace
  //     return mainContent.replace(/\s+/g, " ").trim().substring(0, 8000); // Limit content length
  //   }

  // lib/services/scraper.ts
  private extractContent($: cheerio.Root): string {
    // Remove unwanted elements
    $("script, style, nav, footer, iframe, noscript, header, aside").remove();

    // Try multiple selectors to find main content
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

    // Clean up whitespace but preserve some structure
    const cleaned = mainContent
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim();

    // Return up to 8000 characters
    return cleaned.substring(0, 8000);
  }

  private extractLinks($: cheerio.Root): string[] {
    const links: string[] = [];
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, this.baseUrl).href;
          if (this.isValidUrl(absoluteUrl) && !this.visited.has(absoluteUrl)) {
            links.push(absoluteUrl);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });
    return links;
  }

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
      console.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  async scrapeWebsite(): Promise<ScrapedPage[]> {
    const pages: ScrapedPage[] = [];
    const queue: string[] = [this.baseUrl];

    while (queue.length > 0 && pages.length < this.maxPages) {
      const url = queue.shift()!;
      const page = await this.scrapePage(url);

      if (page) {
        pages.push(page);
        // Add new links to queue
        page.links.forEach((link) => {
          if (!this.visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        });
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return pages;
  }
}
