/**
 * Diagnostic script to analyze scraping and storage efficiency
 * Run with: npx tsx scripts/diagnose-scraping.ts <website-url>
 */

import { createServiceClient } from "../lib/supabase/service";
import { WebScraper } from "../lib/services/scraper";
import { BrowserScraper } from "../lib/services/browserScraper";
import { ContentParser } from "../lib/services/contentParser";

async function diagnoseScraping(websiteUrl: string) {
  console.log(`\n🔍 Diagnosing scraping for: ${websiteUrl}\n`);
  console.log("=".repeat(80));

  const supabase = createServiceClient();

  // Step 1: Check existing embeddings
  console.log("\n📊 STEP 1: Checking existing embeddings in database...");
  const { data: existingEmbeddings, error: dbError } = await supabase
    .from("website_embeddings")
    .select("id, page_url, content_section, metadata, created_at")
    .eq("website_url", websiteUrl)
    .order("created_at", { ascending: false });

  if (dbError) {
    console.error("❌ Database error:", dbError);
    return;
  }

  console.log(`   Found ${existingEmbeddings?.length || 0} existing embeddings`);
  if (existingEmbeddings && existingEmbeddings.length > 0) {
    const uniquePages = new Set(existingEmbeddings.map((e) => e.page_url));
    console.log(`   Unique pages: ${uniquePages.size}`);
    console.log(`   Total content length: ${existingEmbeddings.reduce((sum, e) => sum + e.content_section.length, 0)} chars`);
    console.log(`   Average chunk size: ${Math.round(existingEmbeddings.reduce((sum, e) => sum + e.content_section.length, 0) / existingEmbeddings.length)} chars`);
    
    console.log("\n   Sample chunks:");
    existingEmbeddings.slice(0, 3).forEach((e, i) => {
      console.log(`   ${i + 1}. Page: ${e.page_url}`);
      console.log(`      Content: ${e.content_section.substring(0, 100)}...`);
      console.log(`      Length: ${e.content_section.length} chars`);
    });
  }

  // Step 2: Test HTTP scraper
  console.log("\n🌐 STEP 2: Testing HTTP scraper...");
  try {
    const httpScraper = new WebScraper(websiteUrl, 5);
    const httpPages = await httpScraper.scrapeWebsite();
    
    console.log(`   ✅ HTTP scraper found ${httpPages.length} pages`);
    httpPages.forEach((page, i) => {
      console.log(`   ${i + 1}. ${page.url}`);
      console.log(`      Title: ${page.title}`);
      console.log(`      Content length: ${page.content.length} chars`);
      console.log(`      Quality score: ${page.qualityScore}/100`);
      console.log(`      Links found: ${page.links.length}`);
    });
  } catch (error) {
    console.error("   ❌ HTTP scraper failed:", error);
  }

  // Step 3: Test Browser scraper
  console.log("\n🌐 STEP 3: Testing Browser scraper...");
  try {
    const browserScraper = new BrowserScraper(websiteUrl, 5);
    const browserPages = await browserScraper.scrapeWebsite();
    
    console.log(`   ✅ Browser scraper found ${browserPages.length} pages`);
    browserPages.forEach((page, i) => {
      console.log(`   ${i + 1}. ${page.url}`);
      console.log(`      Title: ${page.title}`);
      console.log(`      Content length: ${page.content.length} chars`);
      console.log(`      Quality score: ${page.qualityScore}/100`);
      console.log(`      Links found: ${page.links.length}`);
    });

    // Cleanup
    await browserScraper.closeBrowser();
  } catch (error) {
    console.error("   ❌ Browser scraper failed:", error);
  }

  // Step 4: Test content parsing
  console.log("\n📝 STEP 4: Testing content parsing...");
  try {
    const parser = new ContentParser();
    const testUrl = websiteUrl;
    
    // Fetch a test page
    const response = await fetch(testUrl);
    const html = await response.text();
    
    const parsed = parser.parse(html, testUrl);
    console.log(`   ✅ Parsed content:`);
    console.log(`      Title: ${parsed.title}`);
    console.log(`      Main content length: ${parsed.mainContent.length} chars`);
    console.log(`      Word count: ${parsed.metadata.wordCount}`);
    console.log(`      Headings: ${parsed.headings.length}`);
    console.log(`      Paragraphs: ${parsed.paragraphs.length}`);
    console.log(`      Quality score: ${parser.calculateQualityScore(parsed)}/100`);
    console.log(`      Unique word ratio: ${parsed.metadata.uniqueWordRatio.toFixed(2)}`);
    console.log(`      Has boilerplate: ${parsed.metadata.hasBoilerplate}`);
    
    console.log("\n   Sample headings:");
    parsed.headings.slice(0, 5).forEach((h, i) => {
      console.log(`      ${i + 1}. H${h.level}: ${h.text}`);
    });
    
    console.log("\n   Sample content (first 500 chars):");
    console.log(`      ${parsed.mainContent.substring(0, 500)}...`);
  } catch (error) {
    console.error("   ❌ Content parsing failed:", error);
  }

  // Step 5: Recommendations
  console.log("\n💡 STEP 5: Recommendations...");
  
  if (existingEmbeddings && existingEmbeddings.length < 10) {
    console.log("   ⚠️  Very few embeddings found - consider:");
    console.log("      - Re-running ingestion with browser scraper (useBrowser=true)");
    console.log("      - Increasing maxPages parameter");
    console.log("      - Checking if website is a single-page application");
  }
  
  if (existingEmbeddings && existingEmbeddings.length > 0) {
    const avgChunkSize = existingEmbeddings.reduce((sum, e) => sum + e.content_section.length, 0) / existingEmbeddings.length;
    if (avgChunkSize < 500) {
      console.log("   ⚠️  Chunks are quite small - consider:");
      console.log("      - Checking if content parser is filtering too aggressively");
      console.log("      - Verifying website content is being captured properly");
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ Diagnosis complete!\n");
}

// Run if called directly
if (require.main === module) {
  const websiteUrl = process.argv[2];
  if (!websiteUrl) {
    console.error("Usage: npx tsx scripts/diagnose-scraping.ts <website-url>");
    process.exit(1);
  }
  
  diagnoseScraping(websiteUrl).catch(console.error);
}

export { diagnoseScraping };

