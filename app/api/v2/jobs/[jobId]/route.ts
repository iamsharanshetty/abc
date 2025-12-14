// app/api/v2/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

// GET /api/v2/jobs/[jobId] - Get job status
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // ⚠️ CRITICAL: Await params first!
    const params = await context.params;
    const jobId = params.jobId;

    if (!jobId) {
      throw new ValidationError("Job ID is required");
    }

    logger.info("Fetching job status", { jobId });

    // Retrieve the job run details
    const run = await runs.retrieve(jobId);

    if (!run) {
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

    // Map Trigger.dev status to our status
    const statusMap: Record<string, string> = {
      PENDING: "pending",
      QUEUED: "pending",
      EXECUTING: "running",
      WAITING: "running",
      DEQUEUED: "running",
      COMPLETED: "completed",
      FAILED: "failed",
      SYSTEM_FAILURE: "failed",
      CRASHED: "failed",
      CANCELED: "canceled",
      EXPIRED: "failed",
      TIMED_OUT: "failed",
      DELAYED: "pending",
      PENDING_VERSION: "pending",
    };

    const status = statusMap[run.status] || "unknown";

    // Calculate progress
    let progress = 0;
    if (status === "running") {
      progress = 50;
    } else if (status === "completed") {
      progress = 100;
    }

    const response = {
      success: true,
      data: {
        jobId: run.id,
        status,
        progress,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        ...(run.finishedAt && { completedAt: run.finishedAt }),
        ...(status === "completed" && run.output && { result: run.output }),
        ...(status === "failed" &&
          run.error && {
            error: {
              message: run.error.message,
              name: run.error.name,
              stackTrace: run.error.stackTrace,
            },
          }),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching job status", { error });
    return handleError(error);
  }
}

// DELETE /api/v2/jobs/[jobId] - Cancel job
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // ⚠️ CRITICAL: Await params first!
    const params = await context.params;
    const jobId = params.jobId;

    if (!jobId) {
      throw new ValidationError("Job ID is required");
    }

    logger.info("Canceling job", { jobId });

    await runs.cancel(jobId);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        message: "Job canceled successfully",
      },
    });
  } catch (error) {
    logger.error("Error canceling job", { error });
    return handleError(error);
  }
}
