// app/api/v2/analytics/route.ts
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

    // Get conversations by day
    const { data: dailyConversations } = await supabase
      .from("conversations")
      .select("created_at")
      .eq("agent_id", agentId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Group by day
    const conversationsByDay = groupByDay(dailyConversations || []);

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

    // Get lead status breakdown
    const { data: leadsByStatus } = await supabase
      .from("leads")
      .select("status")
      .eq("agent_id", agentId)
      .gte("captured_at", startDate.toISOString());

    const statusBreakdown = leadsByStatus?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get feedback stats
    const aiService = new AIAgentService();
    const feedbackStats = await aiService.getFeedbackStats(agentId);

    logger.info("Analytics retrieved", { agentId, timeRange });

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
        conversationsByDay,
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

/**
 * Helper function to group conversations by day
 */
function groupByDay(
  conversations: Array<{ created_at: string }>
): Array<{ date: string; count: number }> {
  const grouped: Record<string, number> = {};

  conversations.forEach((conv) => {
    const date = new Date(conv.created_at).toISOString().split("T")[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

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
