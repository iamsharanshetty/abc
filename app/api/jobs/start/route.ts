// app/api/jobs/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { validateAndSanitizeUrl, validateMaxPages, validateBoolean } from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeWebsitePayload } from "../analyze-website";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info("Received job start request", { url: body.url });

    // Validate inputs
    const url = validateAndSanitizeUrl(body.url);
    const maxPages = validateMaxPages(body.maxPages);
    const useBrowser = validateBoolean(body.useBrowser, false);
    const agentRole = body.agentRole || "support";

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job progress in database
    const supabase = await createClient();
    await supabase.from("job_progress").insert({
      job_id: jobId,
      status: "queued",
      progress: 0,
      message: "Job queued for processing",
      current_step: "queued",
      metadata: {
        url,
        maxPages,
        useBrowser,
        agentRole,
      },
    });

    // Trigger the job
    const payload: AnalyzeWebsitePayload = {
      jobId,
      url,
      maxPages,
      useBrowser,
      agentRole,
    };

    // Start the Trigger.dev task
    const handle = await tasks.trigger("analyze-website", payload);

    logger.info("Job started successfully", { jobId, triggerHandle: handle.id });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        triggerJobId: handle.id,
        status: "queued",
        message: "Website analysis job started successfully",
      },
    });

  } catch (error) {
    logger.error("Failed to start job", { error });
    return handleError(error);
  }
}