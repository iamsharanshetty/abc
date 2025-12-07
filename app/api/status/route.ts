// app/api/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateAndSanitizeUrl } from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
import { ValidationError } from "@/lib/errors/AppError";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      throw new ValidationError("URL parameter is required");
    }

    logger.info("Checking status for URL", { url });

    // Validate URL
    const sanitizedUrl = validateAndSanitizeUrl(url);

    // Get embeddings from database
    const supabase = await createClient();

    type EmbeddingItem = {
      page_url: string;
      created_at: string;
      metadata: any;
    };

    const { data, error } = await supabase
      .from("website_embeddings")
      .select("page_url, created_at, metadata")
      .eq("website_url", sanitizedUrl)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const typedData = data as EmbeddingItem[] | null;

    // Get unique pages
    const uniquePages = new Map<string, EmbeddingItem>();
    typedData?.forEach((item) => {
      if (!uniquePages.has(item.page_url)) {
        uniquePages.set(item.page_url, item);
      }
    });

    const pages = Array.from(uniquePages.values());
    const isAnalyzed = pages.length > 0;
    const lastAnalyzed = pages.length > 0 ? pages[0].created_at : null;

    logger.info("Status check complete", {
      url: sanitizedUrl,
      isAnalyzed,
      pagesFound: pages.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        websiteUrl: sanitizedUrl,
        isAnalyzed,
        lastAnalyzed,
        totalEmbeddings: typedData?.length || 0,
        uniquePages: pages.length,
        pages: pages.map((p) => ({
          url: p.page_url,
          title: p.metadata?.title || "Untitled",
          analyzedAt: p.created_at,
        })),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
