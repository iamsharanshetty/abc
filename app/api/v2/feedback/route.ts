// app/api/v2/feedback/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { AIAgentService } from "@/lib/services/aiAgent";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import {
  withRateLimit,
  feedbackRateLimiter,
  analyticsRateLimiter,
} from "@/lib/middleware/rateLimiter";

/**
 * GET /api/v2/feedback?agentId=xxx - Get feedback statistics
 * Rate Limited: 30 requests per minute per IP
 */
async function feedbackGetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      throw new ValidationError("agentId is required");
    }

    console.log("Getting feedback stats for agent:", agentId);

    const aiService = new AIAgentService();
    const stats = await aiService.getFeedbackStats(agentId);

    logger.info("Feedback stats retrieved", { agentId, stats });

    return NextResponse.json({
      success: true,
      data: {
        agentId,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Error getting feedback stats:", error);
    return handleError(error);
  }
}

// Export GET with rate limiting (using analytics limiter since it's read-only stats)
export const GET = withRateLimit(analyticsRateLimiter, feedbackGetHandler);

/**
 * POST /api/v2/feedback - Submit feedback for a conversation
 * Rate Limited: 10 requests per minute per IP
 */
async function feedbackPostHandler(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.conversationId) {
      throw new ValidationError("conversationId is required");
    }

    if (!body.rating || ![1, -1].includes(body.rating)) {
      throw new ValidationError("rating must be 1 (positive) or -1 (negative)");
    }

    // Validate comment length if provided
    if (body.comment && body.comment.length > 500) {
      throw new ValidationError("Comment cannot exceed 500 characters");
    }

    logger.info("Feedback submission", {
      conversationId: body.conversationId,
      rating: body.rating,
      hasComment: !!body.comment,
    });

    const aiService = new AIAgentService();
    const success = await aiService.submitFeedback(
      body.conversationId,
      body.rating,
      body.comment
    );

    if (!success) {
      throw new Error("Failed to submit feedback");
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Feedback submitted successfully",
        conversationId: body.conversationId,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export POST with rate limiting
export const POST = withRateLimit(feedbackRateLimiter, feedbackPostHandler);
