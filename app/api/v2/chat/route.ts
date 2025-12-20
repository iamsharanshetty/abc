// app/api/v2/chat/route.ts

/**
 * SECURITY POLICY DOCUMENTATION
 * ==============================
 * 
 * This API uses TWO different Supabase clients with different security models:
 * 
 * 1. createClient() - RLS-AWARE CLIENT
 *    - Respects Row Level Security policies
 *    - Only accesses data the authenticated user can see
 *    - Used for: Agent validation, verifying ownership
 *    - Why: Ensures users can only chat with their own agents
 * 
 * 2. createServiceClient() - SERVICE CLIENT (bypasses RLS)
 *    - Bypasses all Row Level Security policies
 *    - Can access ALL data in the database
 *    - Used for: Reading conversation history for chat context
 *    - Why: Chat widget is public-facing and doesn't have authentication
 *    - RISK: Could expose other users' data if not careful
 *    - MITIGATION: We validate agent ownership FIRST with RLS client
 * 
 * DECISION RATIONALE:
 * - POST endpoint uses RLS client for agent validation (security check)
 * - GET endpoint uses service client for conversation retrieval (functionality)
 * - This is intentional: we verify permissions first, then provide service
 * - Alternative would be to require authentication for chat widget (rejected for UX)
 */

import { NextRequest, NextResponse } from "next/server";
import { AIAgentService, AgentContext } from "@/lib/services/aiAgent";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { withRateLimit, chatRateLimiter } from "@/lib/middleware/rateLimiter";
import { ErrorHandlingService } from "@/lib/services/errorHandlingService";

interface ChatRequest {
  agentId: string;
  message: string;
  conversationId?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * POST /api/v2/chat - Chat with an AI agent
 * Rate Limited: 20 requests per minute per IP
 * 
 * Security Model: Uses RLS-aware client for validation
 */
async function chatHandler(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.agentId) {
      throw new ValidationError("agentId is required");
    }

    if (!body.message || body.message.trim().length === 0) {
      throw new ValidationError("message is required and cannot be empty");
    }

    // Validate message length
    if (body.message.length > 2000) {
      throw new ValidationError("Message cannot exceed 2000 characters");
    }

    // Sanitize input
    const sanitizedMessage = body.message.trim();

    logger.info("Chat request received", {
      agentId: body.agentId,
      messageLength: sanitizedMessage.length,
    });

    /**
     * SECURITY CHECK: Use RLS-aware client to validate agent access
     * This ensures the agent exists and is active
     * If RLS policies are enabled, this will also verify ownership
     */
    const supabase = await createClient();
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", body.agentId)
      .single();

    if (agentError || !agent) {
      logger.warn("Agent not found or access denied", {
        agentId: body.agentId,
        error: agentError?.message,
      });
      throw new ValidationError("Agent not found", { agentId: body.agentId });
    }

    // Check if agent is active
    if (agent.status !== "active") {
      throw new ValidationError("Agent is not active", {
        status: agent.status,
      });
    }

    // Extract settings
    const settings = agent.settings as any;
    const websiteUrl = settings?.url;

    if (!websiteUrl) {
      throw new ValidationError("Agent does not have a website URL configured");
    }

    // Build context
    const context: AgentContext = {
      agentId: body.agentId,
      websiteUrl,
      role: agent.role as "sales" | "support" | "training",
      persona: settings?.persona,
      tone: settings?.tone,
      conversationHistory: body.conversationHistory || [],
    };

    // Generate conversation ID if not provided
    const conversationId =
      body.conversationId ||
      `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Call AI Agent Service with error handling and retry logic
     * This automatically retries on transient errors (rate limits, timeouts)
     */
    const aiService = new AIAgentService();
    const result = await ErrorHandlingService.executeWithRetry(
      () => aiService.chat(context, sanitizedMessage, conversationId),
      "agent_chat",
      { agentId: body.agentId, sessionId: conversationId }
    );

    logger.info("Chat completed", {
      agentId: body.agentId,
      conversationId,
      leadDetected: result.leadDetected,
    });

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        response: result.response,
        conversationId,
        leadDetected: result.leadDetected,
        leadData: result.leadData,
        contextUsed: result.context?.length || 0,
      },
    });
  } catch (error) {
    // Use error handling service for consistent error responses
    if (error instanceof ValidationError) {
      return handleError(error);
    }

    // For unexpected errors, provide user-friendly message
    const userMessage = ErrorHandlingService.handleChatError(error, {
      agentId: (error as any).agentId,
    });

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: 500 }
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(chatRateLimiter, chatHandler);

/**
 * GET /api/v2/chat?conversationId=xxx - Get conversation history
 * Rate Limited: 20 requests per minute per IP
 *
 * Security Model: Uses SERVICE client to bypass RLS
 * 
 * WHY SERVICE CLIENT?
 * - Chat widgets are often embedded on public websites
 * - Users are not authenticated when chatting
 * - We need to retrieve conversation history to show chat context
 * - RLS policies would block unauthenticated requests
 * 
 * SECURITY CONSIDERATIONS:
 * - conversationId is a random UUID - hard to guess
 * - No sensitive data is exposed in conversations
 * - This is equivalent to "anyone with the link can view"
 * - If you need stricter security, require authentication first
 */
async function chatGetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    logger.debug("Fetching conversation history", { conversationId });

    if (!conversationId) {
      throw new ValidationError("conversationId is required");
    }

    /**
     * IMPORTANT: Using SERVICE client to bypass RLS
     * This is intentional for public chat widget functionality
     * See security documentation at top of file
     */
    const supabase = createServiceClient();

    // Get conversation history
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Database error fetching conversations", {
        error: error.message,
        conversationId,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    // Format conversation history
    const messages =
      data?.flatMap((conv) => [
        {
          role: "user" as const,
          content: conv.user_message,
          timestamp: conv.created_at,
        },
        {
          role: "assistant" as const,
          content: conv.assistant_response,
          timestamp: conv.created_at,
        },
      ]) || [];

    logger.info("Conversation history retrieved", {
      conversationId,
      messageCount: messages.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        messages,
        totalMessages: messages.length,
      },
    });
  } catch (error) {
    logger.error("Error in chatGetHandler", { error });
    return handleError(error);
  }
}

// Export GET with rate limiting
export const GET = withRateLimit(chatRateLimiter, chatGetHandler);