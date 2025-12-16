// lib/services/chatService.ts
import { openai } from "@/lib/openai";
import { PromptTemplateService } from "@/lib/services/promptTemplate";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  isLeadCapture: boolean;
  leadStage?: "initial" | "name" | "email" | "confirm";
  context?: string[];
}

export class ChatService {
  /**
   * Generate AI response with context from vector store
   */
  static async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[],
    agentId: string,
    websiteUrl: string
  ): Promise<ChatResponse> {
    try {
      // 1. Detect lead intent
      const isLeadIntent = PromptTemplateService.detectLeadIntent(userMessage);

      // 2. Retrieve relevant context from vector store
      const relevantContext = await this.retrieveContext(
        userMessage,
        websiteUrl
      );

      // 3. Build messages array
      const messages: ChatMessage[] = [
        ...conversationHistory,
        {
          role: "user",
          content:
            relevantContext.length > 0
              ? PromptTemplateService.generateContextualPrompt(
                  userMessage,
                  relevantContext
                )
              : userMessage,
        },
      ];

      // 4. Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective model
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const assistantMessage =
        completion.choices[0]?.message?.content ||
        "I apologize, but I'm having trouble generating a response right now. Please try again.";

      // 5. Log the interaction
      await this.logInteraction(agentId, userMessage, assistantMessage);

      return {
        message: assistantMessage,
        isLeadCapture: isLeadIntent,
        context: relevantContext,
      };
    } catch (error) {
      logger.error("Error generating chat response", {
        error,
        agentId,
        userMessage,
      });
      throw new Error("Failed to generate response");
    }
  }

  /**
   * Retrieve relevant context from vector store using similarity search
   */
  private static async retrieveContext(
    query: string,
    websiteUrl: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      // Generate embedding for user query
      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });

      const embedding = queryEmbedding.data[0].embedding;

      // Search vector store
      const supabase = await createClient();

      const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        filter_website_url: websiteUrl,
      });

      if (error) {
        logger.error("Error retrieving context", { error });
        return [];
      }

      // Extract content sections
      return (data || []).map((item: any) => item.content_section);
    } catch (error) {
      logger.error("Error in context retrieval", { error });
      return [];
    }
  }

  /**
   * Log conversation interaction
   */
  private static async logInteraction(
    agentId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from("chat_logs").insert({
        agent_id: agentId,
        user_message: userMessage,
        assistant_message: assistantMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error logging interaction", { error });
      // Don't throw - logging failure shouldn't break chat
    }
  }

  /**
   * Validate and sanitize user input
   */
  static validateMessage(message: string): { valid: boolean; error?: string } {
    if (!message || typeof message !== "string") {
      return { valid: false, error: "Message is required" };
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: "Message cannot be empty" };
    }

    if (trimmed.length > 2000) {
      return {
        valid: false,
        error: "Message is too long (max 2000 characters)",
      };
    }

    // Check for potential injection attempts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
    ];

    if (dangerousPatterns.some((pattern) => pattern.test(trimmed))) {
      return { valid: false, error: "Invalid message content" };
    }

    return { valid: true };
  }
}
