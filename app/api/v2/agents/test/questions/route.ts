// app/api/v2/agents/test/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import {
  withRateLimit,
  analyticsRateLimiter,
} from "@/lib/middleware/rateLimiter";
import type { Database } from "@/lib/database.types";

// ✅ Use the exact database type for agents
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

/**
 * GET /api/v2/agents/test/questions?agentId=xxx - Get suggested test questions
 */
async function agentSuggestQuestionsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      throw new ValidationError("agentId is required");
    }

    // Get agent details
    const supabase = await createClient();

    // ✅ FIX: Cast the data type after fetching
    const { data, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError || !data) {
      throw new ValidationError("Agent not found");
    }

    // ✅ Cast to the correct type
    const agent = data as AgentRow;

    // ✅ Now TypeScript correctly knows agent.role exists and is a string
    const role = agent.role || "support";
    const suggestedQuestions = generateTestQuestions(role);

    return NextResponse.json({
      success: true,
      data: {
        agentId,
        role,
        suggestedQuestions,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export GET with analytics rate limiting
export const GET = withRateLimit(
  analyticsRateLimiter,
  agentSuggestQuestionsHandler
);

/**
 * Generate test questions based on agent role
 */
function generateTestQuestions(role: string): string[] {
  const questionsByRole: Record<string, string[]> = {
    sales: [
      "What products or services do you offer?",
      "How much does it cost?",
      "Can I get a demo?",
      "What makes your product different from competitors?",
      "Do you offer any discounts or promotions?",
    ],
    support: [
      "How do I reset my password?",
      "I'm having trouble with [feature name]",
      "What are your business hours?",
      "How can I contact support?",
      "Where can I find documentation?",
    ],
    training: [
      "How do I get started?",
      "What are the key features?",
      "Can you show me how to use [feature]?",
      "Are there any tutorials available?",
      "What are best practices for using this?",
    ],
    custom: [
      "What can you help me with?",
      "Tell me about your services",
      "How do I get started?",
      "What makes you different?",
      "Can you provide more information?",
    ],
  };

  return (
    questionsByRole[role] || [
      "What can you help me with?",
      "Tell me about your company",
      "How do I contact you?",
      "What are your main features?",
      "Can you provide more information?",
    ]
  );
}
