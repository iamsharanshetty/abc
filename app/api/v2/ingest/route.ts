// app/api/v2/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@/lib/supabase/server";
import { ingestWebsiteTask, ingestWebsiteHandler } from "@/jobs/ingest-website";
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

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check for critical environment variables
    if (!process.env.TRIGGER_SECRET_KEY) {
      throw new ValidationError("Missing TRIGGER_SECRET_KEY in environment variables");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new ValidationError("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
    }

    // Trigger the background job
    let handle;
    try {
      // DEVELOPMENT BYPASS: Run directly if in dev mode
      if (process.env.NODE_ENV === "development") {
        logger.info("⚠️ DEV MODE: Running ingestion directly (skipping Trigger.dev queue)");

        const mockId = `dev_job_${Date.now()}`;
        const globalStore = (globalThis as any).__DEV_JOBS__ = (globalThis as any).__DEV_JOBS__ || {};

        // Initialize job status
        globalStore[mockId] = {
          jobId: mockId,
          status: "running",
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Run async
        (async () => {
          try {
            logger.info("Starting direct execution...");
            const result = await ingestWebsiteHandler({
              url,
              maxPages,
              useBrowser,
              forceRefresh,
              userId: user?.id,
            }, {} as any);

            logger.info("Direct execution completed.");
            globalStore[mockId] = {
              ...globalStore[mockId],
              status: "completed",
              progress: 100,
              updatedAt: new Date(),
              finishedAt: new Date(),
              result: result, // Store the actual result
              output: result // Map to 'output' as expected by the status route
            };
          } catch (e) {
            logger.error("Direct execution failed", { error: e });
            globalStore[mockId] = {
              ...globalStore[mockId],
              status: "failed",
              progress: 0,
              updatedAt: new Date(),
              finishedAt: new Date(),
              error: {
                message: e instanceof Error ? e.message : "Unknown error",
                name: "JobError"
              }
            };
          }
        })();

        // Return the mock handle
        handle = { id: mockId };
      } else {
        // Standard Production Trigger
        handle = await tasks.trigger<typeof ingestWebsiteTask>(
          "ingest-website",
          {
            url,
            maxPages,
            useBrowser,
            forceRefresh,
            userId: user?.id,
          }
        );
      }
    } catch (e) {
      logger.error("Failed to trigger task", { error: e });
      throw new Error(`Failed to trigger background job: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

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
