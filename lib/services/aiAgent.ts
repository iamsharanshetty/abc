// lib/services/aiAgent.ts
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config";
import { LangChainService } from "./langchainService";
import { CRMService } from "./crmService";
import type { AgentSettings, LeadData } from "@/types/agent";

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type { LeadData } from "@/types/agent";

export interface AgentContext {
  agentId: string;
  websiteUrl: string;
  role: "sales" | "support" | "training" | "custom";
  persona?: string;
  tone?: string;
  conversationHistory: AgentMessage[];
}

// export interface LeadData {
//   name?: string;
//   email?: string;
//   phone?: string;
//   company?: string;
//   interest?: string;
//   capturedAt: string;
//   conversationId: string;
// }

export class AIAgentService {
  private langChainService: LangChainService;
  private crmService: CRMService;

  constructor() {
    this.langChainService = new LangChainService();
    this.crmService = new CRMService();
  }

  /**
   * Search for relevant context from website embeddings
   */
  private async searchContext(
    websiteUrl: string,
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const supabase = await createClient();

      // Generate embedding for the query
      const queryEmbedding = await openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: query,
      });

      const embeddingVector = queryEmbedding.data[0].embedding;

      // CRITICAL FIX: Convert to proper format for pgvector
      // The database expects a string representation that can be cast to vector
      const embeddingString = `[${embeddingVector.join(",")}]`;

      // Search for similar content using vector similarity
      const { data, error } = await supabase.rpc("match_website_content", {
        query_embedding: embeddingString,
        match_threshold: 0.7,
        match_count: limit,
        website_url_filter: websiteUrl,
      });

      if (error) {
        logger.error("Error searching context", { error, websiteUrl });
        return [];
      }

      // Extract content sections from results
      return data?.map((item: any) => item.content_section) || [];
    } catch (error) {
      logger.error("Error in searchContext", { error });
      return [];
    }
  }
  /**
   * Detect if user message contains lead information
   */
  private extractLeadData(message: string): Partial<LeadData> | null {
    const leadData: Partial<LeadData> = {};

    // Email regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailRegex);
    if (emails && emails.length > 0) {
      leadData.email = emails[0];
    }

    // Phone regex (basic)
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = message.match(phoneRegex);
    if (phones && phones.length > 0) {
      leadData.phone = phones[0];
    }

    // Name detection (very basic - looks for "my name is" or "I'm")
    const nameRegex =
      /(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
    const nameMatch = message.match(nameRegex);
    if (nameMatch) {
      leadData.name = nameMatch[1];
    }

    return Object.keys(leadData).length > 0 ? leadData : null;
  }

  /**
   * Detect if user is expressing interest (lead signal)
   */
  private detectInterestSignal(message: string): boolean {
    const interestKeywords = [
      "demo",
      "quote",
      "pricing",
      "price",
      "buy",
      "purchase",
      "interested",
      "sign up",
      "get started",
      "contact",
      "talk to",
      "speak with",
      "more information",
      "learn more",
    ];

    const lowerMessage = message.toLowerCase();
    return interestKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Main chat function - generates AI response using LangChain
   */
  async chat(
    context: AgentContext,
    userMessage: string,
    conversationId: string
  ): Promise<{
    response: string;
    leadDetected: boolean;
    leadData?: Partial<LeadData>;
    context?: string[];
  }> {
    try {
      logger.info("Agent chat request", {
        agentId: context.agentId,
        conversationId,
      });

      // Step 1: Search for relevant context
      const relevantContent = await this.searchContext(
        context.websiteUrl,
        userMessage,
        5
      );

      logger.debug("Context retrieved", {
        contentCount: relevantContent.length,
      });

      // Step 2: Detect lead signals
      const hasInterestSignal = this.detectInterestSignal(userMessage);
      const extractedLeadData = this.extractLeadData(userMessage);

      // Step 3: Generate response using LangChain
      const assistantResponse = await this.langChainService.generateResponse(
        context,
        userMessage,
        relevantContent
      );

      // Step 4: Save conversation to database
      await this.saveConversation(
        conversationId,
        context.agentId,
        userMessage,
        assistantResponse
      );

      // Step 5: Handle lead detection (NO EMAIL - just save to DB)
      let leadDetected = false;
      if (extractedLeadData || hasInterestSignal) {
        leadDetected = true;
        if (extractedLeadData) {
          const leadId = await this.saveLead(
            conversationId,
            context.agentId,
            extractedLeadData
          );

          if (leadId) {
            // Send to webhook and CRM (NO EMAIL)
            this.sendLeadNotifications(
              leadId,
              context.agentId,
              extractedLeadData,
              conversationId
            ).catch((err) => {
              logger.error("Error sending lead notifications", { err });
            });
          }
        }
      }

      logger.info("Chat completed", {
        conversationId,
        leadDetected,
        hasLeadData: !!extractedLeadData,
      });

      return {
        response: assistantResponse,
        leadDetected,
        leadData: extractedLeadData || undefined,
        context: relevantContent,
      };
    } catch (error) {
      logger.error("Error in agent chat", { error });

      // Fallback response
      return {
        response:
          "I'm having trouble processing your request right now. Please try again in a moment, or feel free to contact our team directly.",
        leadDetected: false,
      };
    }
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    conversationId: string,
    agentId: string,
    userMessage: string,
    assistantResponse: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from("conversations").insert({
        id: conversationId,
        agent_id: agentId,
        user_message: userMessage,
        assistant_response: assistantResponse,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error saving conversation", { error, conversationId });
    }
  }

  /**
   * Save lead to database
   */
  private async saveLead(
    conversationId: string,
    agentId: string,
    leadData: Partial<LeadData>
  ): Promise<string | null> {
    try {
      const supabase = await createClient();

      const fullLeadData = {
        ...leadData,
        agent_id: agentId,
        conversation_id: conversationId,
        captured_at: new Date().toISOString(),
        status: "new",
      };

      const { data, error } = await supabase
        .from("leads")
        .insert(fullLeadData)
        .select("id")
        .single();

      if (error) {
        logger.error("Error saving lead", { error });
        return null;
      }

      logger.info("Lead saved", { conversationId, agentId, leadId: data?.id });
      return data?.id || null;
    } catch (error) {
      logger.error("Error saving lead", { error, conversationId });
      return null;
    }
  }

  /**
   * Send lead notifications (webhook and CRM only - NO EMAIL)
   */
  private async sendLeadNotifications(
    leadId: string,
    agentId: string,
    leadData: Partial<LeadData>,
    conversationId: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      // Get agent details
      const { data: agent } = await supabase
        .from("agents")
        .select("name, role, settings, user_id")
        .eq("id", agentId)
        .single();

      if (!agent) {
        logger.error("Agent not found for notifications", { agentId });
        return;
      }

      const settings = agent.settings as any;
      const fullLeadData: LeadData = {
        ...leadData,
        capturedAt: new Date().toISOString(),
        conversationId,
      };

      // 1. Send to webhook (if configured)
      if (settings?.webhookUrl) {
        try {
          const webhookSent = await this.sendLeadToWebhook(
            settings.webhookUrl,
            fullLeadData
          );

          if (webhookSent) {
            await supabase
              .from("leads")
              .update({
                sent_to_webhook: true,
                webhook_sent_at: new Date().toISOString(),
              })
              .eq("id", leadId);
          }
        } catch (error) {
          logger.error("Error sending webhook", { error });
        }
      }

      // 2. Sync to CRM (if configured)
      if (settings?.crmEnabled && this.crmService.isHubSpotConfigured()) {
        try {
          const crmResult = await this.crmService.syncToHubSpot(
            fullLeadData,
            agent.name
          );

          if (crmResult.success) {
            await supabase
              .from("leads")
              .update({
                crm_synced: true,
                crm_sync_id: crmResult.crmContactId,
                crm_synced_at: new Date().toISOString(),
              })
              .eq("id", leadId);
          }
        } catch (error) {
          logger.error("Error syncing to CRM", { error });
        }
      }

      logger.info("Lead notifications completed", { leadId });
    } catch (error) {
      logger.error("Error in sendLeadNotifications", { error });
    }
  }

  /**
   * Send lead to webhook
   */
  async sendLeadToWebhook(
    webhookUrl: string,
    leadData: LeadData
  ): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "lead_captured",
          timestamp: new Date().toISOString(),
          lead: leadData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      logger.info("Lead sent to webhook", { webhookUrl });
      return true;
    } catch (error) {
      logger.error("Error sending lead to webhook", { error, webhookUrl });
      return false;
    }
  }

  /**
   * Submit feedback for a conversation
   */
  async submitFeedback(
    conversationId: string,
    rating: 1 | -1,
    comment?: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("conversations")
        .update({
          feedback_rating: rating,
          feedback_comment: comment || null,
          feedback_submitted_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (error) {
        logger.error("Error submitting feedback", { error, conversationId });
        return false;
      }

      logger.info("Feedback submitted", { conversationId, rating });
      return true;
    } catch (error) {
      logger.error("Error in submitFeedback", { error });
      return false;
    }
  }

  /**
   * Get feedback statistics for an agent
   */
  async getFeedbackStats(agentId: string): Promise<{
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    satisfactionRate: number;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("conversations")
        .select("feedback_rating")
        .eq("agent_id", agentId)
        .not("feedback_rating", "is", null);

      if (error) {
        throw error;
      }

      const totalFeedback = data?.length || 0;
      const positiveCount =
        data?.filter((f) => f.feedback_rating === 1).length || 0;
      const negativeCount =
        data?.filter((f) => f.feedback_rating === -1).length || 0;
      const satisfactionRate =
        totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;

      return {
        totalFeedback,
        positiveCount,
        negativeCount,
        satisfactionRate: Math.round(satisfactionRate * 100) / 100,
      };
    } catch (error) {
      logger.error("Error getting feedback stats", { error });
      return {
        totalFeedback: 0,
        positiveCount: 0,
        negativeCount: 0,
        satisfactionRate: 0,
      };
    }
  }

  /**
   * Test agent with sample questions
   */
  async testAgent(
    agentId: string,
    websiteUrl: string,
    testQuestions: string[]
  ): Promise<{
    success: boolean;
    results: Array<{
      question: string;
      response: string;
      contextFound: boolean;
      error?: string;
    }>;
  }> {
    const results = [];

    for (const question of testQuestions) {
      try {
        const context: AgentContext = {
          agentId,
          websiteUrl,
          role: "support",
          conversationHistory: [],
        };

        const result = await this.chat(context, question, `test_${Date.now()}`);

        results.push({
          question,
          response: result.response,
          contextFound: (result.context?.length || 0) > 0,
        });
      } catch (error) {
        results.push({
          question,
          response: "",
          contextFound: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: results.every((r) => !r.error),
      results,
    };
  }
}
