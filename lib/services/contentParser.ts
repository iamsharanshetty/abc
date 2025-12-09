// lib/services/contentParser.ts - ENHANCED VERSION
import * as cheerio from "cheerio";

export interface ParsedContent {
  title: string;
  mainContent: string;
  headings: {
    level: number;
    text: string;
  }[];
  paragraphs: string[];
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    language?: string;
    uniqueWordRatio: number; // NEW: detect repetitive content
    hasBoilerplate: boolean; // NEW: detect boilerplate
  };
}

export class ContentParser {
  // Selectors for content that should be REMOVED
  private readonly JUNK_SELECTORS = [
    "script",
    "style",
    "nav",
    "footer",
    "header",
    "aside",
    "iframe",
    "noscript",
    ".advertisement",
    ".ads",
    ".ad",
    ".sidebar",
    ".cookie-banner",
    ".cookie-notice",
    ".social-share",
    ".comments",
    "#comments",
    ".related-posts",
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="banner"]',
    ".navigation",
    ".menu",
    ".breadcrumb",
    ".breadcrumbs",
    ".share-buttons",
    ".author-bio",
    ".newsletter",
    ".popup",
    ".modal",
  ];

  // Selectors for MAIN content (in priority order)
  private readonly CONTENT_SELECTORS = [
    "article",
    '[role="main"]',
    "main",
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    ".main-content",
    "#content",
    "#main",
    ".post",
    ".article",
  ];

  // Boilerplate detection patterns
  private readonly BOILERPLATE_PATTERNS = [
    /^(copyright|©|all rights reserved)/i,
    /^(terms of service|privacy policy|cookie policy)/i,
    /^(cookie|cookies|we use cookies)/i,
    /^(subscribe|sign up|newsletter)/i,
    /^(follow us|connect with us)/i,
    /^(share this|share on)/i,
    /^(read more|learn more|click here)/i,
  ];

  /**
   * Main parsing function with edge case detection
   */
  parse(html: string, url: string): ParsedContent {
    const $ = cheerio.load(html);

    // Step 1: Remove all junk elements
    this.removeJunkElements($);

    // Step 2: Extract main content
    const mainContent = this.extractMainContent($);

    // Step 3: Extract structured data
    const title = this.extractTitle($);
    const headings = this.extractHeadings($);
    const paragraphs = this.extractParagraphs($);

    // Step 4: Clean and normalize text
    const cleanedContent = this.cleanText(mainContent);

    // Step 5: Generate metadata with enhanced detection
    const metadata = this.generateEnhancedMetadata(cleanedContent, paragraphs);

    return {
      title,
      mainContent: cleanedContent,
      headings,
      paragraphs,
      metadata,
    };
  }

  /**
   * Remove all junk/irrelevant elements with improved detection
   */
  private removeJunkElements($: cheerio.Root): void {
    this.JUNK_SELECTORS.forEach((selector) => {
      $(selector).remove();
    });

    // Remove elements with specific patterns
    $("*").each((_, element) => {
      const $el = $(element);
      const classNames = $el.attr("class") || "";
      const id = $el.attr("id") || "";

      // Remove if class/id contains ad-related or junk keywords
      const junkKeywords =
        /ad|banner|sponsor|promo|popup|cookie|newsletter|subscribe|social|share|comment/i;
      if (junkKeywords.test(classNames) || junkKeywords.test(id)) {
        $el.remove();
      }

      // Remove hidden elements
      const style = $el.attr("style") || "";
      if (
        style.includes("display:none") ||
        style.includes("display: none") ||
        style.includes("visibility:hidden")
      ) {
        $el.remove();
      }
    });

    // Remove elements with aria-hidden
    $('[aria-hidden="true"]').remove();
  }

  /**
   * Extract main content using intelligent selectors with fallback
   */
  private extractMainContent($: cheerio.Root): string {
    // Try each content selector in priority order
    for (const selector of this.CONTENT_SELECTORS) {
      const content = $(selector).first().text();
      if (content && content.trim().length > 200) {
        console.log(`    ✓ Found content using selector: ${selector}`);
        return content;
      }
    }

    // Fallback: Try to find the largest text block
    console.log(`    ℹ️  Using largest text block as fallback`);
    let largestContent = "";
    let largestLength = 0;

    $("div, section, article").each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > largestLength) {
        largestLength = text.length;
        largestContent = text;
      }
    });

    if (largestContent.length > 100) {
      console.log(
        `    ✓ Found ${largestContent.length} chars in largest block`
      );
      return largestContent;
    }

    // Last resort: Get body content
    console.log(`    ⚠️  Using body content as last resort`);
    const bodyContent = $("body").text().trim();

    if (bodyContent.length < 100) {
      console.warn(
        `    ⚠️  Body content is very small (${bodyContent.length} chars) - possible JS-rendered site`
      );
    } else {
      console.log(`    ✓ Found ${bodyContent.length} chars from body`);
    }

    return bodyContent;
  }

  /**
   * Extract page title with multiple fallbacks
   */
  private extractTitle($: cheerio.Root): string {
    const sources = [
      $("h1").first().text(),
      $('meta[property="og:title"]').attr("content"),
      $('meta[name="twitter:title"]').attr("content"),
      $("title").text(),
      $('meta[name="title"]').attr("content"),
    ];

    for (const title of sources) {
      if (title && title.trim().length > 0 && title.trim().length < 200) {
        return title.trim();
      }
    }

    return "Untitled Page";
  }

  /**
   * Extract all headings with hierarchy
   */
  private extractHeadings($: cheerio.Root): { level: number; text: string }[] {
    const headings: { level: number; text: string }[] = [];

    $("h1, h2, h3, h4, h5, h6").each((_, element) => {
      const $heading = $(element);
      const text = $heading.text().trim();
      const level = parseInt($heading.prop("tagName")?.charAt(1) || "1");

      // Filter out boilerplate headings
      if (text.length > 0 && text.length < 200 && !this.isBoilerplate(text)) {
        headings.push({ level, text });
      }
    });

    return headings;
  }

  /**
   * Extract meaningful paragraphs with improved filtering
   */
  private extractParagraphs($: cheerio.Root): string[] {
    const paragraphs: string[] = [];
    const seenFingerprints = new Set<string>();

    $("p").each((_, element) => {
      const text = $(element).text().trim();

      // Only include paragraphs with meaningful content
      if (
        text.length > 50 &&
        text.length < 2000 &&
        this.isLikelyContent(text) &&
        !this.isBoilerplate(text)
      ) {
        // Check for duplicates
        const fingerprint = this.createTextFingerprint(text);
        if (!seenFingerprints.has(fingerprint)) {
          seenFingerprints.add(fingerprint);
          paragraphs.push(text);
        }
      }
    });

    return paragraphs;
  }

  /**
   * Check if text is boilerplate
   */
  private isBoilerplate(text: string): boolean {
    for (const pattern of this.BOILERPLATE_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Create a simple fingerprint for text comparison
   */
  private createTextFingerprint(text: string): string {
    return text.toLowerCase().replace(/\s+/g, " ").trim().substring(0, 100);
  }

  /**
   * Check if text is likely real content
   */
  private isLikelyContent(text: string): boolean {
    // Skip if mostly links/navigation patterns
    const navWords = [
      "home",
      "about",
      "contact",
      "menu",
      "login",
      "sign up",
      "terms",
      "privacy",
    ];
    const lowerText = text.toLowerCase();

    const navWordCount = navWords.filter((word) =>
      lowerText.includes(word)
    ).length;

    if (navWordCount >= 3) {
      return false;
    }

    // Skip if too many capital letters (might be a menu)
    const capsRatio =
      (text.match(/[A-Z]/g) || []).length / text.replace(/\s/g, "").length;
    if (capsRatio > 0.5) {
      return false;
    }

    // Content should have proper sentences
    const hasSentenceMarkers = /[.!?]/.test(text);
    const wordCount = text.split(/\s+/).length;

    // Check for minimum word count and sentence structure
    return hasSentenceMarkers && wordCount >= 10;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return (
      text
        // Replace multiple spaces with single space
        .replace(/\s+/g, " ")
        // Replace multiple newlines with double newline
        .replace(/\n{3,}/g, "\n\n")
        // Remove excessive punctuation
        .replace(/[.]{3,}/g, "...")
        // Remove unicode characters that might cause issues
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Trim
        .trim()
    );
  }

  /**
   * Generate enhanced metadata with repetition detection
   */
  private generateEnhancedMetadata(
    content: string,
    paragraphs: string[]
  ): {
    wordCount: number;
    estimatedReadTime: number;
    language?: string;
    uniqueWordRatio: number;
    hasBoilerplate: boolean;
  } {
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;

    // Average reading speed: 200-250 words per minute
    const estimatedReadTime = Math.ceil(wordCount / 225);

    // Calculate unique word ratio to detect repetitive content
    const uniqueWords = new Set(
      words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
    );
    const uniqueWordRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

    // Detect boilerplate
    const hasBoilerplate = paragraphs.some((p) => this.isBoilerplate(p));

    // Basic language detection
    const language = this.detectLanguage(content);

    return {
      wordCount,
      estimatedReadTime,
      language,
      uniqueWordRatio,
      hasBoilerplate,
    };
  }

  /**
   * Basic language detection
   */
  private detectLanguage(text: string): string | undefined {
    const sample = text.slice(0, 1000);

    // Check for common English words
    const englishWords = ["the", "and", "is", "in", "to", "a", "of"];
    const englishMatches = englishWords.filter((word) =>
      new RegExp(`\\b${word}\\b`, "i").test(sample)
    ).length;

    if (englishMatches >= 4) {
      return "en";
    }

    return undefined;
  }

  /**
   * Calculate content quality score with enhanced metrics
   */
  calculateQualityScore(content: ParsedContent): number {
    let score = 0;

    // Has good title (max 20 points)
    if (content.title && content.title !== "Untitled Page") {
      score += 20;
    }

    // Has sufficient content (max 30 points)
    // Has sufficient content (max 30 points)
    if (content.metadata.wordCount >= 50) {
      // Changed from 100
      score += 15;
    }
    if (content.metadata.wordCount >= 200) {
      // Changed from 300
      score += 15;
    }

    // Has headings (max 20 points)
    if (content.headings.length > 0) {
      score += 10;
    }
    if (content.headings.length >= 3) {
      score += 10;
    }

    // Has paragraphs (max 20 points)
    if (content.paragraphs.length >= 3) {
      score += 10;
    }
    if (content.paragraphs.length >= 5) {
      score += 10;
    }

    // Content is not too short or too long (max 10 points)
    const wordCount = content.metadata.wordCount;
    if (wordCount >= 200 && wordCount <= 5000) {
      score += 5;
    }
    if (wordCount >= 500 && wordCount <= 3000) {
      score += 5;
    }

    // Penalize low unique word ratio (indicates repetitive content)
    if (content.metadata.uniqueWordRatio < 0.3) {
      score -= 10;
      console.log(
        `    ⚠️  Low unique word ratio (${content.metadata.uniqueWordRatio.toFixed(
          2
        )}) - possible repetitive content`
      );
    }

    // Penalize boilerplate content
    if (content.metadata.hasBoilerplate) {
      score -= 5;
      console.log(`    ⚠️  Boilerplate content detected`);
    }

    return Math.max(0, Math.min(100, score));
  }
}
