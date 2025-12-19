// Create new file: app/api/v2/feedback/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { AIAgentService } from "@/lib/services/aiAgent";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import {
  withRateLimit,
  analyticsRateLimiter,
} from "@/lib/middleware/rateLimiter";

/**
 * GET /api/v2/feedback/stats?agentId=xxx - Get feedback statistics
 * Rate Limited: 30 requests per minute per IP
 */
async function feedbackStatsHandler(request: NextRequest) {
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

// Export GET with rate limiting
export const GET = withRateLimit(analyticsRateLimiter, feedbackStatsHandler);
