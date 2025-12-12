// app/api/jobs/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/trigger/client";
import {
  validateAndSanitizeUrl,
  validateMaxPages,
  validateBoolean,
} from "@/lib/utils/validation";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";

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
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

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

    // Trigger the job using v3 API
    const event = await client.sendEvent({
      name: "website.analyze",
      payload: {
        jobId,
        url,
        maxPages,
        useBrowser,
        agentRole,
      },
    });

    logger.info("Job started successfully", { jobId, eventId: event.id });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        triggerJobId: event.id,
        status: "queued",
        message: "Website analysis job started successfully",
      },
    });
  } catch (error) {
    logger.error("Failed to start job", { error });
    return handleError(error);
  }
}
