// app/api/v2/analytics/export/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import {
  withRateLimit,
  analyticsRateLimiter,
} from "@/lib/middleware/rateLimiter";

/**
 * POST /api/v2/analytics/export - Export analytics data
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

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    const timeRange = body.timeRange || "30d";

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
        startDate.setDate(now.getDate() - 30);
    }

    // Get all conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .eq("agent_id", body.agentId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    // Get all leads
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("agent_id", body.agentId)
      .gte("captured_at", startDate.toISOString())
      .order("captured_at", { ascending: false });

    // ✅ FIXED: Add type assertion to resolve TypeScript error
    const { data: conversationsByDay, error: convError } = (await supabase.rpc(
      "get_conversations_by_day",
      {
        p_agent_id: body.agentId,
        p_start_date: startDate.toISOString(),
      } as any
    )) as {
      data: Array<{ date: string; count: number }> | null;
      error: any;
    };

    if (convError) {
      logger.error("Error fetching conversations by day for export", {
        error: convError,
        agentId: body.agentId,
      });
    }

    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: {
          agentId: body.agentId,
          exportedAt: new Date().toISOString(),
          timeRange: timeRange,
          conversations: conversations || [],
          leads: leads || [],
          conversationsByDay: conversationsByDay || [],
        },
      });
    } else {
      // CSV format
      const csv = convertToCSV({
        conversations: conversations || [],
        leads: leads || [],
        conversationsByDay: conversationsByDay || [],
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

export const POST = withRateLimit(analyticsRateLimiter, analyticsExportHandler);

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data: {
  conversations: any[];
  leads: any[];
  conversationsByDay: any[];
}): string {
  const lines: string[] = [];

  // Conversations by day section
  lines.push("=== CONVERSATIONS BY DAY ===");
  lines.push("Date,Count");
  data.conversationsByDay.forEach((item) => {
    lines.push(`"${item.date}","${item.count}"`);
  });

  lines.push("");

  // Conversations section
  lines.push("=== CONVERSATIONS ===");
  lines.push("Date,User Message,Assistant Response,Feedback Rating");
  data.conversations.forEach((conv) => {
    lines.push(
      `"${conv.created_at}","${escapeCsv(conv.user_message)}","${escapeCsv(
        conv.assistant_response
      )}","${conv.feedback_rating || ""}"`
    );
  });

  lines.push("");

  // Leads section
  lines.push("=== LEADS ===");
  lines.push("Date,Name,Email,Phone,Company,Interest,Status");
  data.leads.forEach((lead) => {
    lines.push(
      `"${lead.captured_at}","${lead.name || ""}","${lead.email || ""}","${
        lead.phone || ""
      }","${lead.company || ""}","${lead.interest || ""}","${lead.status}"`
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
