// app/api/jobs/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      throw new ValidationError("jobId parameter is required");
    }

    logger.debug("Fetching job progress", { jobId });

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("job_progress")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (error || !data) {
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

    return NextResponse.json({
      success: true,
      data: {
        jobId: data.job_id,
        status: data.status,
        progress: data.progress,
        message: data.message,
        currentStep: data.current_step,
        pagesScraped: data.pages_scraped,
        pagesProcessed: data.pages_processed,
        error: data.error,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch job progress", { error });
    return handleError(error);
  }
}

// Optional: Endpoint to get all jobs (for dashboard)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, limit = 50, offset = 0 } = body;

    const supabase = await createClient();

    let query = supabase
      .from("job_progress")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: data || [],
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch jobs", { error });
    return handleError(error);
  }
}
