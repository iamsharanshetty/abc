// app/api/v2/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      throw new ValidationError("Job ID is required");
    }

    logger.info("Fetching job status", { jobId });

    // Retrieve the job run details
    const run = await tasks.retrieve(jobId);

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
    const statusMap = {
      PENDING: "pending",
      EXECUTING: "running",
      COMPLETED: "completed",
      FAILED: "failed",
      CANCELED: "canceled",
    } as const;

    const status = statusMap[run.status] || "unknown";

    // Calculate progress percentage
    let progress = 0;
    if (status === "running") {
      // Estimate progress based on time elapsed
      // This is a rough estimate; real progress would come from job logs
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
        ...(run.completedAt && { completedAt: run.completedAt }),
        ...(status === "completed" && run.output && { result: run.output }),
        ...(status === "failed" && run.error && { error: run.error }),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching job status", { error });
    return handleError(error);
  }
}

// Cancel a running job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      throw new ValidationError("Job ID is required");
    }

    logger.info("Canceling job", { jobId });

    // Cancel the job
    await tasks.cancel(jobId);

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
