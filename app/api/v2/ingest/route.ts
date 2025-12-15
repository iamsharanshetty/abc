// app/api/v2/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { ingestWebsiteTask } from "@/jobs/ingest-website";
import {
  validateAndSanitizeUrl,
  validateMaxPages,
  validateBoolean,
} from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info("Received v2 ingest request", { url: body.url });

    // Validate inputs
    const url = validateAndSanitizeUrl(body.url);
    const maxPages = validateMaxPages(body.maxPages);
    const useBrowser = validateBoolean(body.useBrowser, false);
    const forceRefresh = validateBoolean(body.forceRefresh, false);

    logger.debug("Validation passed", {
      url,
      maxPages,
      useBrowser,
      forceRefresh,
    });

    // Trigger the background job
    const handle = await tasks.trigger<typeof ingestWebsiteTask>(
      "ingest-website",
      {
        url,
        maxPages,
        useBrowser,
        forceRefresh,
      }
    );

    logger.info("Job triggered successfully", {
      jobId: handle.id,
      url,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: handle.id,
          websiteUrl: url,
          message: "Website ingestion job started",
          statusUrl: `/api/v2/jobs/${handle.id}`,
        },
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      throw new ValidationError("URL parameter is required");
    }

    const sanitizedUrl = validateAndSanitizeUrl(url);

    // TODO: Implement logic to find jobs by URL
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      data: {
        websiteUrl: sanitizedUrl,
        jobs: [],
        message: "Job history retrieval coming soon",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
