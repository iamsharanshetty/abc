// app/api/jobs/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      throw new ValidationError("jobId is required");
    }

    logger.info("Canceling job", { jobId });

    const supabase = await createClient();

    // Get job details
    const { data: jobData, error: fetchError } = await supabase
      .from("job_progress")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (fetchError || !jobData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Job not found",
            code: "JOB_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Check if job can be canceled
    if (jobData.status === "completed" || jobData.status === "failed") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Job is already ${jobData.status}`,
            code: "JOB_ALREADY_FINISHED",
          },
        },
        { status: 400 }
      );
    }

    // Update job status to failed
    const { error: updateError } = await supabase
      .from("job_progress")
      .update({
        status: "failed",
        message: "Job canceled by user",
        error: "Canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", jobId);

    if (updateError) {
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }

    logger.info("Job canceled successfully", { jobId });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        message: "Job canceled successfully",
      },
    });
  } catch (error) {
    logger.error("Failed to cancel job", { error });
    return handleError(error);
  }
}
