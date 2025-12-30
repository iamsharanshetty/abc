// app/api/v2/agents/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { AIAgentService } from "@/lib/services/aiAgent";
import {
  withRateLimit,
  agentTestRateLimiter,
  analyticsRateLimiter,
} from "@/lib/middleware/rateLimiter";
import type { Database } from "@/lib/database.types";

// ✅ Use the exact database type for agents
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

/**
 * POST /api/v2/agents/test - Test an agent with sample questions
 * Rate Limited: 5 requests per 5 minutes per IP (tests are expensive)
 */
async function agentTestHandler(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.agentId) {
      throw new ValidationError("agentId is required");
    }

    if (!body.testQuestions || !Array.isArray(body.testQuestions)) {
      throw new ValidationError("testQuestions must be an array");
    }

    if (body.testQuestions.length === 0) {
      throw new ValidationError("At least one test question is required");
    }

    if (body.testQuestions.length > 10) {
      throw new ValidationError("Maximum 10 test questions allowed");
    }

    logger.info("Agent test requested", {
      agentId: body.agentId,
      questionCount: body.testQuestions.length,
    });

    // Get agent details
    const supabase = await createClient();
    const { data, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", body.agentId)
      .single();

    if (agentError || !data) {
      throw new ValidationError("Agent not found");
    }

    // ✅ Cast to the correct type
    const agent = data as AgentRow;

    // ✅ Parse settings from JSONB column
    const settings = agent.settings as any;
    const websiteUrl = settings?.url;

    if (!websiteUrl) {
      throw new ValidationError("Agent does not have a website URL configured");
    }

    // Run tests
    const aiService = new AIAgentService();
    const testResults = await aiService.testAgent(
      body.agentId,
      websiteUrl,
      body.testQuestions
    );

    // Calculate success rate
    const successfulTests = testResults.results.filter((r) => !r.error).length;
    const successRate = (successfulTests / body.testQuestions.length) * 100;

    // Calculate context found rate
    const testsWithContext = testResults.results.filter(
      (r) => r.contextFound
    ).length;
    const contextRate = (testsWithContext / body.testQuestions.length) * 100;

    logger.info("Agent test completed", {
      agentId: body.agentId,
      successRate,
      contextRate,
    });

    return NextResponse.json({
      success: true,
      data: {
        agentId: body.agentId,
        agentName: agent.name,
        testResults: testResults.results,
        summary: {
          totalQuestions: body.testQuestions.length,
          successfulTests,
          failedTests: body.testQuestions.length - successfulTests,
          successRate: Math.round(successRate),
          contextFoundRate: Math.round(contextRate),
        },
        recommendations: generateRecommendations(
          successRate,
          contextRate,
          testResults.results
        ),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export POST with strict rate limiting (tests are expensive)
export const POST = withRateLimit(agentTestRateLimiter, agentTestHandler);

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(
  successRate: number,
  contextRate: number,
  results: any[]
): string[] {
  const recommendations: string[] = [];

  if (successRate < 80) {
    recommendations.push(
      "Consider refining your agent's prompt or persona for better responses"
    );
  }

  if (contextRate < 60) {
    recommendations.push(
      "Low context retrieval rate. Consider adding more content to your website or improving your embeddings"
    );
  }

  const hasErrors = results.some((r) => r.error);
  if (hasErrors) {
    recommendations.push(
      "Some tests failed with errors. Check your agent configuration and API limits"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Great! Your agent is performing well. Continue monitoring conversations for improvements"
    );
  }

  return recommendations;
}

/**
 * GET /api/v2/agents/test/questions - Get suggested test questions
 * Rate Limited: 30 requests per minute per IP
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

    // Generate role-specific test questions
    const role = agent.role;
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

// Export GET with analytics rate limiting (read-only, not expensive)
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
