// app/api/v2/analytics/route.ts - FULLY FIXED VERSION
// ✅ Fixed: All TypeScript errors resolved

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { AIAgentService } from "@/lib/services/aiAgent";
import {
  withRateLimit,
  analyticsRateLimiter,
} from "@/lib/middleware/rateLimiter";

/**
 * GET /api/v2/analytics - Get agent analytics
 * Rate Limited: 30 requests per minute per IP
 *
 * ✅ FIXED: Now uses database aggregation for date grouping
 */
async function analyticsGetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");
    const timeRange = searchParams.get("timeRange") || "7d"; // 7d, 30d, 90d

    if (!agentId) {
      throw new ValidationError("agentId is required");
    }

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get conversation count
    const { count: conversationCount } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", startDate.toISOString());

    // Get lead count
    const { count: leadCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("captured_at", startDate.toISOString());

    // ✅ FIXED: Add type assertion to resolve TypeScript error
    // This is a known Supabase TypeScript limitation with RPC functions
    const { data: conversationsByDay, error: convError } = (await supabase.rpc(
      "get_conversations_by_day",
      {
        p_agent_id: agentId,
        p_start_date: startDate.toISOString(),
      } as any
    )) as {
      data: Array<{ date: string; count: number }> | null;
      error: any;
    };

    if (convError) {
      logger.error("Error fetching conversations by day", {
        error: convError,
        agentId,
        timeRange,
      });
      // Return empty array if function fails, don't break entire response
      // This allows graceful degradation
    }

    // Get lead conversion rate
    const conversionRate =
      conversationCount && conversationCount > 0
        ? ((leadCount || 0) / conversationCount) * 100
        : 0;

    // Get recent conversations
    const { data: recentConversations } = await supabase
      .from("conversations")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(10);

    // ✅ FIXED: Add explicit type for leadsByStatus
    const { data: leadsByStatus } = (await supabase
      .from("leads")
      .select("status")
      .eq("agent_id", agentId)
      .gte("captured_at", startDate.toISOString())) as {
      data: Array<{ status: string }> | null;
    };

    const statusBreakdown = leadsByStatus?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get feedback stats
    const aiService = new AIAgentService();
    const feedbackStats = await aiService.getFeedbackStats(agentId);

    logger.info("Analytics retrieved", {
      agentId,
      timeRange,
      conversationCount,
      leadCount,
      conversationsByDayCount: conversationsByDay?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        agentId,
        timeRange,
        summary: {
          totalConversations: conversationCount || 0,
          totalLeads: leadCount || 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
          satisfactionRate: feedbackStats.satisfactionRate,
          totalFeedback: feedbackStats.totalFeedback,
        },
        feedbackBreakdown: {
          positive: feedbackStats.positiveCount,
          negative: feedbackStats.negativeCount,
        },
        // ✅ Now comes directly from database aggregation
        conversationsByDay: conversationsByDay || [],
        statusBreakdown: statusBreakdown || {},
        recentConversations: recentConversations || [],
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export GET with rate limiting
export const GET = withRateLimit(analyticsRateLimiter, analyticsGetHandler);

// ✅ REMOVED: The old client-side groupByDay function is deleted
// It has been replaced by the database function get_conversations_by_day

/**
 * POST /api/v2/analytics/export - Export analytics data
 * Rate Limited: 30 requests per minute per IP
 */
async function analyticsExportHandler(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agentId) {
      throw new ValidationError("agentId is required");
    }

    const format = body.format || "json"; // json or csv

    if (!["json", "csv"].includes(format)) {
      throw new ValidationError("format must be 'json' or 'csv'");
    }

    const supabase = await createClient();

    // Get all conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .eq("agent_id", body.agentId)
      .order("created_at", { ascending: false });

    // Get all leads
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("agent_id", body.agentId)
      .order("captured_at", { ascending: false });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: {
          agentId: body.agentId,
          exportedAt: new Date().toISOString(),
          conversations: conversations || [],
          leads: leads || [],
        },
      });
    } else {
      // CSV format
      const csv = convertToCSV({
        conversations: conversations || [],
        leads: leads || [],
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="agent_${body.agentId}_analytics.csv"`,
        },
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

// Export POST with rate limiting
export const POST = withRateLimit(analyticsRateLimiter, analyticsExportHandler);

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data: { conversations: any[]; leads: any[] }): string {
  const lines: string[] = [];

  // Conversations section
  lines.push("=== CONVERSATIONS ===");
  lines.push("Date,User Message,Assistant Response");
  data.conversations.forEach((conv) => {
    lines.push(
      `"${conv.created_at}","${escapeCsv(conv.user_message)}","${escapeCsv(
        conv.assistant_response
      )}"`
    );
  });

  lines.push("");

  // Leads section
  lines.push("=== LEADS ===");
  lines.push("Date,Name,Email,Phone,Company,Status");
  data.leads.forEach((lead) => {
    lines.push(
      `"${lead.captured_at}","${lead.name || ""}","${lead.email || ""}","${
        lead.phone || ""
      }","${lead.company || ""}","${lead.status}"`
    );
  });

  return lines.join("\n");
}

/**
 * Escape CSV special characters
 */
function escapeCsv(text: string): string {
  if (!text) return "";
  return text.replace(/"/g, '""');
}
