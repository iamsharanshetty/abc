// app/api/v2/analytics/export/route.ts
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
