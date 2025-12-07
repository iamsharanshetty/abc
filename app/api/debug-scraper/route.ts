// app/api/debug-scraper/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { validateAndSanitizeUrl } from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      throw new ValidationError("URL parameter is required");
    }

    const url = validateAndSanitizeUrl(urlParam);

    logger.info("Starting debug scrape", { url });

    const debugInfo: any = {
      url,
      timestamp: new Date().toISOString(),
      steps: [],
    };

    // Step 1: Try to fetch the URL
    debugInfo.steps.push({ step: 1, action: "Fetching URL" });

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    debugInfo.steps.push({
      step: 2,
      action: "Fetch successful",
      statusCode: response.status,
      contentType: response.headers["content-type"],
      contentLength: response.data?.length || 0,
    });

    // Step 2: Parse HTML
    const $ = cheerio.load(response.data);

    debugInfo.steps.push({
      step: 3,
      action: "HTML parsed",
      title: $("title").text() || "No title",
      h1Count: $("h1").length,
      h2Count: $("h2").length,
      paragraphCount: $("p").length,
      linkCount: $("a[href]").length,
    });

    // Step 3: Check for main content selectors
    const contentSelectors = [
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
      "body",
    ];

    const selectorResults: any[] = [];
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      const text = element.text();
      selectorResults.push({
        selector,
        found: element.length > 0,
        textLength: text.length,
        preview: text.substring(0, 100).replace(/\s+/g, " ").trim(),
      });
    }

    debugInfo.steps.push({
      step: 4,
      action: "Content selector check",
      results: selectorResults,
    });

    // Step 4: Get body text
    const bodyText = $("body").text();
    debugInfo.steps.push({
      step: 5,
      action: "Body text extracted",
      totalLength: bodyText.length,
      wordCount: bodyText.split(/\s+/).length,
      preview: bodyText.substring(0, 200).replace(/\s+/g, " ").trim(),
    });

    // Step 5: Extract all links
    const links: string[] = [];
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).href;
          links.push(absoluteUrl);
        } catch {
          // Invalid URL
        }
      }
    });

    const sameDomainLinks = links.filter((link) => {
      try {
        const linkHostname = new URL(link).hostname;
        const baseHostname = new URL(url).hostname;
        return linkHostname === baseHostname;
      } catch {
        return false;
      }
    });

    debugInfo.steps.push({
      step: 6,
      action: "Links extracted",
      totalLinks: links.length,
      sameDomainLinks: sameDomainLinks.length,
      sampleLinks: sameDomainLinks.slice(0, 10),
    });

    // Step 6: Check for common blocking patterns
    const blockingPatterns = {
      hasCloudflare: response.data.includes("cloudflare"),
      hasRecaptcha: response.data.includes("recaptcha"),
      hasCaptcha: response.data.includes("captcha"),
      hasRobotCheck: response.data.includes("robot"),
      is403: response.status === 403,
      is401: response.status === 401,
    };

    debugInfo.steps.push({
      step: 7,
      action: "Blocking check",
      patterns: blockingPatterns,
    });

    logger.info("Debug scrape complete", {
      url,
      steps: debugInfo.steps.length,
    });

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      recommendation: generateRecommendation(debugInfo, blockingPatterns),
    });
  } catch (error) {
    logger.error("Debug scrape failed", { error });
    return handleError(error);
  }
}

function generateRecommendation(
  debugInfo: any,
  blockingPatterns: any
): string[] {
  const recommendations: string[] = [];

  // Check for blocking
  if (blockingPatterns.hasCloudflare) {
    recommendations.push(
      "⚠️ Cloudflare detected - may require browser-based scraping"
    );
  }
  if (blockingPatterns.hasRecaptcha || blockingPatterns.hasCaptcha) {
    recommendations.push("⚠️ CAPTCHA detected - automated scraping may fail");
  }
  if (blockingPatterns.is403 || blockingPatterns.is401) {
    recommendations.push(
      "⚠️ Access denied - check User-Agent or authentication"
    );
  }

  // Check content
  const bodyStep = debugInfo.steps.find((s: any) => s.step === 5);
  if (bodyStep && bodyStep.totalLength < 500) {
    recommendations.push(
      "⚠️ Very little content found - page may be JavaScript-rendered"
    );
  }

  const linksStep = debugInfo.steps.find((s: any) => s.step === 6);
  if (linksStep && linksStep.sameDomainLinks === 0) {
    recommendations.push(
      "⚠️ No same-domain links found - may be a single page"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Page appears scrapable with standard methods");
  }

  return recommendations;
}
