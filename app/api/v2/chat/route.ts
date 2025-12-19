// app/api/v2/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AIAgentService, AgentContext } from "@/lib/services/aiAgent";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
// ADD THIS IMPORT - Use service client instead
import { createServiceClient } from "@/lib/supabase/service";
import { withRateLimit, chatRateLimiter } from "@/lib/middleware/rateLimiter";

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

    // Get agent details from database
    const supabase = await createClient();
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", body.agentId)
      .single();

    if (agentError || !agent) {
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

    // Call AI Agent Service
    const aiService = new AIAgentService();
    const result = await aiService.chat(
      context,
      sanitizedMessage,
      conversationId
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
    return handleError(error);
  }
}

// Export with rate limiting
export const POST = withRateLimit(chatRateLimiter, chatHandler);

/**
 * GET /api/v2/chat?conversationId=xxx - Get conversation history
 * Rate Limited: 20 requests per minute per IP
 *
 * FIXED: Now uses service client to bypass RLS policies
 */
async function chatGetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    console.log("=== GET Conversation History ===");
    console.log("conversationId:", conversationId);

    if (!conversationId) {
      throw new ValidationError("conversationId is required");
    }

    // CRITICAL FIX: Use service client instead of regular client
    // Service client bypasses RLS policies
    const supabase = createServiceClient();

    // Get conversation history
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .order("created_at", { ascending: true });

    console.log("Query result - Data count:", data?.length);
    console.log("Query result - Error:", error);

    if (error) {
      console.error("Database error:", error);
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

    console.log("Total messages formatted:", messages.length);

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        messages,
        totalMessages: messages.length,
      },
    });
  } catch (error) {
    console.error("Error in chatGetHandler:", error);
    return handleError(error);
  }
}

// Export GET with rate limiting
export const GET = withRateLimit(chatRateLimiter, chatGetHandler);
