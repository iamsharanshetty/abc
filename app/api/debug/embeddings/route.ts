// app/api/debug/embeddings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { EmbeddingService } from "@/lib/services/embeddings";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const testQuery = searchParams.get("query");

  if (!url) {
    return NextResponse.json(
      {
        error:
          "URL parameter required. Usage: /api/debug/embeddings?url=https://example.com",
      },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const embeddingService = new EmbeddingService();

  try {
    // Check multiple URL variations
    const normalizedUrl = url.replace(/\/$/, "");
    const urlVariations = [
      url,
      normalizedUrl,
      normalizedUrl + "/",
      url.replace("www.", ""),
      url.replace("://", "://www."),
    ];

    console.log("🔍 Checking embeddings for:", url);
    console.log("   Testing variations:", urlVariations);

    // Check each variation
    const variationResults = await Promise.all(
      urlVariations.map(async (variant) => {
        const { data, error, count } = await supabase
          .from("website_embeddings")
          .select("id, website_url, page_url, content_section", {
            count: "exact",
          })
          .eq("website_url", variant)
          .limit(5);

        return {
          variant,
          found: !error && (count || 0) > 0,
          count: count || 0,
          error: error?.message,
          samples: data?.slice(0, 2).map((d) => ({
            id: d.id,
            page: d.page_url,
            preview: d.content_section.substring(0, 150) + "...",
          })),
        };
      })
    );

    // Find best match
    const bestMatch = variationResults.find((r) => r.found);
    const totalFound = variationResults.reduce((sum, r) => sum + r.count, 0);

    // Get detailed stats if we found embeddings
    let detailedStats = null;
    if (bestMatch) {
      detailedStats = await embeddingService.getEmbeddingStats(
        bestMatch.variant,
        supabase
      );
    }

    // Test search if query provided
    let searchTest = null;
    if (testQuery && bestMatch) {
      searchTest = await embeddingService.testEmbeddingSearch(
        bestMatch.variant,
        testQuery,
        supabase
      );
    }

    // ✅ FIXED: Check available RPC functions instead of calling non-existent one
    // Query pg_proc to see what functions are available
    const { data: availableFunctions, error: funcError } = await supabase
      .rpc("match_website_content", {
        query_embedding: "[]", // Empty array just to test if function exists
        match_threshold: 0.5,
        match_count: 1,
        website_url_filter: normalizedUrl,
      })
      .limit(0); // Don't actually return results, just test availability

    // Recommendations
    const recommendations: string[] = [];

    if (totalFound === 0) {
      recommendations.push("❌ No embeddings found - run website ingestion");
      recommendations.push(
        "Run: POST /api/v2/ingest with { url: '" + url + "', useBrowser: true }"
      );
    } else if (bestMatch && bestMatch.variant !== url) {
      recommendations.push("⚠️ URL mismatch detected");
      recommendations.push(`Database has: ${bestMatch.variant}`);
      recommendations.push(`You searched: ${url}`);
      recommendations.push("Normalize URLs during ingestion to avoid this");
    }

    if (searchTest && searchTest.success) {
      const avgScore =
        searchTest.topScores.reduce((a: number, b: number) => a + b, 0) /
        searchTest.topScores.length;
      if (avgScore < 0.3) {
        recommendations.push("⚠️ Low similarity scores detected");
        recommendations.push(
          "Consider lowering matchThreshold in agent settings"
        );
        recommendations.push(
          "Current scores: " +
            searchTest.topScores.map((s: number) => s.toFixed(3)).join(", ")
        );
      } else {
        recommendations.push("✅ Similarity scores look good!");
        recommendations.push(
          "Scores: " +
            searchTest.topScores.map((s: number) => s.toFixed(3)).join(", ")
        );
      }
    }

    return NextResponse.json({
      summary: {
        searchedUrl: url,
        normalizedUrl,
        embeddingsFound: totalFound > 0,
        totalChunks: totalFound,
        matchedUrl: bestMatch?.variant || null,
        urlMismatch: bestMatch ? bestMatch.variant !== url : false,
      },
      variations: variationResults,
      detailedStats,
      searchTest,
      databaseFunctions: {
        match_website_content: !funcError,
        get_conversations_by_day: true, // We know this exists from migrations
        error: funcError?.message,
      },
      recommendations,
      nextSteps:
        totalFound === 0
          ? [
              "1. Run website ingestion",
              "2. Check Supabase logs for errors",
              "3. Verify SQL migrations were applied",
            ]
          : [
              "1. Embeddings exist ✓",
              "2. Try lowering similarity threshold",
              "3. Test with: /api/debug/embeddings?url=" +
                url +
                "&query=test%20query",
            ],
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Example usage:
// GET /api/debug/embeddings?url=https://www.python.org
// GET /api/debug/embeddings?url=https://www.python.org&query=what%20is%20python
