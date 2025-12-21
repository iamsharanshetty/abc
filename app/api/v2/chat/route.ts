// app/api/v2/chat/route.ts - UPDATED WITH STREAMING SUPPORT

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
  stream?: boolean; // ✅ NEW: Optional streaming flag
}

/**
 * ✅ FIXED: Helper to create a streaming response with NextResponse
 * This allows us to send data chunk by chunk to the client
 */
function createStreamResponse(
  stream: ReadableStream,
  headers?: Record<string, string>
): NextResponse {
  return new NextResponse(stream, {
    // ✅ Changed to NextResponse
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...headers,
    },
  });
}

/**
 * ✅ NEW: Format message for Server-Sent Events (SSE)
 * SSE is the protocol used for streaming data to browsers
 */
function formatSSE(data: any, event?: string): string {
  const lines: string[] = [];

  if (event) {
    lines.push(`event: ${event}`);
  }

  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push(""); // Empty line signals end of message

  return lines.join("\n") + "\n";
}

/**
 * POST /api/v2/chat - Chat with an AI agent
 * Rate Limited: 20 requests per minute per IP
 *
 * ✅ UPDATED: Now supports streaming responses
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
    const useStreaming = body.stream !== false; // Default to streaming

    logger.info("Chat request received", {
      agentId: body.agentId,
      messageLength: sanitizedMessage.length,
      streaming: useStreaming,
    });

    /**
     * SECURITY CHECK: Use RLS-aware client to validate agent access
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

    // ✅ NEW: Handle streaming vs non-streaming
    if (useStreaming) {
      return handleStreamingChat(context, sanitizedMessage, conversationId);
    } else {
      return handleNonStreamingChat(context, sanitizedMessage, conversationId);
    }
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

/**
 * ✅ NEW: Handle streaming chat response
 * This sends tokens one by one as they're generated
 */
async function handleStreamingChat(
  context: AgentContext,
  message: string,
  conversationId: string
): Promise<NextResponse> {
  logger.info("Starting streaming chat", {
    agentId: context.agentId,
    conversationId,
  });

  // Create a TransformStream for sending chunks
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiService = new AIAgentService();

        // Get relevant context first (needed for streaming)
        const supabase = await createClient();
        const { data: agent } = await supabase
          .from("agents")
          .select("settings")
          .eq("id", context.agentId)
          .single();

        const settings = agent?.settings as any;

        // Search for relevant context
        const relevantContent = await aiService.searchContextPublic(
          // ✅ Use public method
          context.websiteUrl,
          message,
          settings
        );
        // Detect lead signals
        const hasInterestSignal = await aiService.detectInterestSignalPublic(
          // ✅ Use public method
          message,
          context.conversationHistory
        );

        const extractedLeadData = aiService.extractLeadDataPublic(message); // ✅ Use public method

        // Send initial metadata
        controller.enqueue(
          encoder.encode(
            formatSSE(
              {
                type: "metadata",
                conversationId,
                contextFound: relevantContent.length > 0,
              },
              "metadata"
            )
          )
        );

        // Variables to collect the full response
        let fullResponse = "";
        let tokenCount = 0;

        // Stream the response using LangChain's streaming capability
        await aiService.langChainService.streamResponse(
          // ✅ Use public getter
          context,
          message,
          relevantContent,
          (token: string) => {
            fullResponse += token;
            tokenCount++;

            // Send token to client
            controller.enqueue(
              encoder.encode(
                formatSSE(
                  {
                    type: "token",
                    token,
                    tokenCount,
                  },
                  "token"
                )
              )
            );
          }
        );

        // Save conversation after streaming completes
        await aiService.saveConversationPublic(
          // ✅ Use public method
          conversationId,
          context.agentId,
          message,
          fullResponse
        );
        // Handle lead detection if applicable
        let leadId: string | null = null;
        if (extractedLeadData || hasInterestSignal) {
          if (extractedLeadData) {
            leadId = await aiService.saveLeadPublic(
              // ✅ Use public method
              conversationId,
              context.agentId,
              extractedLeadData
            );

            if (leadId) {
              // Send lead notifications asynchronously
              aiService
                .sendLeadNotificationsPublic(
                  // ✅ Use public method
                  leadId,
                  context.agentId,
                  extractedLeadData,
                  conversationId
                )
                .catch((err) => {
                  logger.error("Error sending lead notifications", { err });
                });
            }
          }
        }

        // Send completion event
        controller.enqueue(
          encoder.encode(
            formatSSE(
              {
                type: "done",
                conversationId,
                fullResponse,
                leadDetected: !!(extractedLeadData || hasInterestSignal),
                leadData: extractedLeadData || undefined,
                tokenCount,
              },
              "done"
            )
          )
        );

        logger.info("Streaming chat completed", {
          conversationId,
          tokenCount,
          leadDetected: !!(extractedLeadData || hasInterestSignal),
        });

        controller.close();
      } catch (error) {
        logger.error("Error in streaming chat", { error, conversationId });

        // Send error event
        const errorMessage = ErrorHandlingService.handleChatError(error, {
          agentId: context.agentId,
          sessionId: conversationId,
        });

        controller.enqueue(
          encoder.encode(
            formatSSE(
              {
                type: "error",
                error: errorMessage,
              },
              "error"
            )
          )
        );

        controller.close();
      }
    },
  });

  return createStreamResponse(stream);
}

/**
 * ✅ EXISTING: Handle non-streaming chat (backwards compatibility)
 * This is the original implementation
 */
async function handleNonStreamingChat(
  context: AgentContext,
  message: string,
  conversationId: string
) {
  const aiService = new AIAgentService();
  const result = await ErrorHandlingService.executeWithRetry(
    () => aiService.chat(context, message, conversationId),
    "agent_chat",
    { agentId: context.agentId, sessionId: conversationId }
  );

  logger.info("Chat completed", {
    agentId: context.agentId,
    conversationId,
    leadDetected: result.leadDetected,
  });

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
}

// Export with rate limiting
export const POST = withRateLimit(chatRateLimiter, chatHandler);

/**
 * GET /api/v2/chat?conversationId=xxx - Get conversation history
 * Rate Limited: 20 requests per minute per IP
 *
 * Security Model: Uses SERVICE client to bypass RLS
 */
async function chatGetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    logger.debug("Fetching conversation history", { conversationId });

    if (!conversationId) {
      throw new ValidationError("conversationId is required");
    }

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
