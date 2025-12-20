// lib/services/aiAgent.ts
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config";
import { LangChainService } from "./langchainService";
import { CRMService } from "./crmService";
import type { AgentSettings, LeadData } from "@/types/agent";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

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
    let hasValidData = false;

    // ===== EMAIL VALIDATION (More Strict) =====
    // Enhanced email regex that follows RFC 5322 more closely
    const emailRegex =
      /\b[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/g;
    const emails = message.match(emailRegex);

    if (emails && emails.length > 0) {
      // Additional validation: check for common invalid patterns
      const email = emails[0].toLowerCase();

      // Reject obviously fake emails
      const fakePatterns = [
        /test@/i,
        /example@/i,
        /sample@/i,
        /fake@/i,
        /noemail@/i,
        /@test\./i,
        /@example\./i,
      ];

      const isFake = fakePatterns.some((pattern) => pattern.test(email));

      if (!isFake && email.includes("@") && email.includes(".")) {
        leadData.email = email;
        hasValidData = true;
        logger.debug("Valid email extracted", { email });
      }
    }

    // ===== PHONE VALIDATION (Using Library) =====
    try {
      // Try to find any phone-like patterns
      const phonePatterns = [
        // North American format: +1 (123) 456-7890, 123-456-7890, (123) 456-7890
        /(?:\+1\s?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
        // International format: +XX XXX XXX XXXX
        /\+[0-9]{1,3}[\s.-]?(?:\([0-9]{1,4}\)|[0-9]{1,4})[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{3,4}/g,
        // Simple 10-digit: 1234567890
        /\b[0-9]{10,11}\b/g,
      ];

      let bestPhoneMatch: string | null = null;

      for (const pattern of phonePatterns) {
        const matches = message.match(pattern);
        if (matches && matches.length > 0) {
          // Validate with libphonenumber-js
          for (const match of matches) {
            try {
              // Try parsing without country code first (assume US)
              if (isValidPhoneNumber(match, "US")) {
                const phoneNumber = parsePhoneNumber(match, "US");
                bestPhoneMatch = phoneNumber.formatInternational();
                break;
              }
              // Try parsing with country code
              if (isValidPhoneNumber(match)) {
                const phoneNumber = parsePhoneNumber(match);
                bestPhoneMatch = phoneNumber.formatInternational();
                break;
              }
            } catch (e) {
              // Continue to next match
              continue;
            }
          }
          if (bestPhoneMatch) break;
        }
      }

      if (bestPhoneMatch) {
        leadData.phone = bestPhoneMatch;
        hasValidData = true;
        logger.debug("Valid phone extracted", { phone: bestPhoneMatch });
      }
    } catch (error) {
      logger.warn("Error during phone number extraction", { error });
    }

    // ===== NAME EXTRACTION (Improved with multiple patterns) =====
    const namePatterns = [
      // "My name is John Doe" or "I'm John Doe"
      /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
      // "John Doe here" or "John Doe speaking"
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:\s+here|\s+speaking)/i,
      // Email-based name extraction (first.last@domain)
      /^([a-z]+)\.([a-z]+)@/i,
    ];

    for (const pattern of namePatterns) {
      const nameMatch = message.match(pattern);
      if (nameMatch) {
        let extractedName = nameMatch[1];

        // If email pattern, combine first and last name
        if (pattern.toString().includes("@")) {
          extractedName = `${nameMatch[1]} ${nameMatch[2]}`;
          // Capitalize each word
          extractedName = extractedName
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        }

        // Validate: name should be 2-50 characters and contain only letters and spaces
        if (
          extractedName.length >= 2 &&
          extractedName.length <= 50 &&
          /^[A-Za-z\s]+$/.test(extractedName)
        ) {
          leadData.name = extractedName.trim();
          hasValidData = true;
          logger.debug("Valid name extracted", { name: extractedName });
          break;
        }
      }
    }

    // If email was extracted but no name, try to extract name from email
    if (leadData.email && !leadData.name) {
      const emailLocalPart = leadData.email.split("@")[0];

      // Check if email local part looks like a name (contains dot or has multiple capitals)
      if (emailLocalPart.includes(".") || /[A-Z].*[A-Z]/.test(emailLocalPart)) {
        const nameParts = emailLocalPart
          .split(/[._-]/)
          .map(
            (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          .filter((part) => part.length > 1);

        if (nameParts.length >= 2) {
          leadData.name = nameParts.slice(0, 2).join(" ");
          logger.debug("Name extracted from email", { name: leadData.name });
        }
      }
    }

    // ===== COMPANY EXTRACTION =====
    const companyPatterns = [
      /(?:i work at|i'm from|i represent|my company is|company:)\s+([A-Z][A-Za-z0-9\s&.,'-]+(?:Inc|LLC|Ltd|Corporation|Corp)?)/i,
      /(?:at|from)\s+([A-Z][A-Za-z0-9\s&.,'-]+(?:Inc|LLC|Ltd|Corporation|Corp))/,
    ];

    for (const pattern of companyPatterns) {
      const companyMatch = message.match(pattern);
      if (companyMatch) {
        const company = companyMatch[1].trim();
        if (company.length >= 2 && company.length <= 100) {
          leadData.company = company;
          hasValidData = true;
          logger.debug("Company extracted", { company });
          break;
        }
      }
    }

    // Log extraction summary
    if (hasValidData) {
      logger.info("Lead data extracted", {
        hasEmail: !!leadData.email,
        hasPhone: !!leadData.phone,
        hasName: !!leadData.name,
        hasCompany: !!leadData.company,
      });
    }

    return hasValidData ? leadData : null;
  }

  /**
   * Enhanced interest signal detection with more context awareness
   */
  private detectInterestSignal(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Strong interest signals (definite interest)
    const strongSignals = [
      "buy now",
      "purchase",
      "sign up",
      "get started",
      "i want",
      "i need",
      "interested in buying",
      "ready to buy",
      "place an order",
    ];

    // Medium interest signals (likely interest)
    const mediumSignals = [
      "demo",
      "quote",
      "pricing",
      "price",
      "cost",
      "how much",
      "interested",
      "more information",
      "learn more",
      "contact",
      "talk to",
      "speak with",
      "schedule",
      "book a call",
    ];

    // Check strong signals
    if (strongSignals.some((keyword) => lowerMessage.includes(keyword))) {
      logger.debug("Strong interest signal detected", {
        message: lowerMessage,
      });
      return true;
    }

    // Check medium signals
    if (mediumSignals.some((keyword) => lowerMessage.includes(keyword))) {
      logger.debug("Medium interest signal detected", {
        message: lowerMessage,
      });
      return true;
    }

    return false;
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
      // ✅ FIXED: Use service client imported at top
      const supabase = createServiceClient();

      console.log("=== Submitting Feedback ===");
      console.log("Conversation ID:", conversationId);
      console.log("Rating:", rating);
      console.log("Comment:", comment);

      // First, check if conversation exists
      const { data: existingConv, error: checkError } = await supabase
        .from("conversations")
        .select("id, agent_id")
        .eq("id", conversationId)
        .single();

      console.log("Existing conversation found:", existingConv);
      console.log("Check error:", checkError);

      if (checkError || !existingConv) {
        logger.error("Conversation not found for feedback", {
          conversationId,
          error: checkError,
        });
        return false;
      }

      // Update with feedback
      const { data, error } = await supabase
        .from("conversations")
        .update({
          feedback_rating: rating,
          feedback_comment: comment || null,
          feedback_submitted_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .select();

      console.log("Update result:", data);
      console.log("Update error:", error);

      if (error) {
        logger.error("Error submitting feedback", { error, conversationId });
        return false;
      }

      logger.info("Feedback submitted", { conversationId, rating });
      console.log("✅ Feedback saved successfully");
      return true;
    } catch (error) {
      logger.error("Error in submitFeedback", { error });
      console.error("Exception in submitFeedback:", error);
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
      const supabase = createServiceClient();

      console.log("=== Getting Feedback Stats ===");
      console.log("Agent ID:", agentId);

      // First, check if agent exists
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id, name")
        .eq("id", agentId)
        .single();

      console.log("Agent found:", agent);
      console.log("Agent error:", agentError);

      if (agentError || !agent) {
        logger.error("Agent not found for feedback stats", { agentId });
        return {
          totalFeedback: 0,
          positiveCount: 0,
          negativeCount: 0,
          satisfactionRate: 0,
        };
      }

      // Get all conversations with feedback for this agent
      const { data, error } = await supabase
        .from("conversations")
        .select("feedback_rating, id, created_at")
        .eq("agent_id", agentId)
        .not("feedback_rating", "is", null);

      console.log("Feedback data found:", data);
      console.log("Feedback count:", data?.length);
      console.log("Feedback error:", error);

      if (error) {
        logger.error("Error getting feedback stats", { error, agentId });
        console.error("Query error:", error);
        throw error;
      }

      const totalFeedback = data?.length || 0;
      const positiveCount =
        data?.filter((f) => f.feedback_rating === 1).length || 0;
      const negativeCount =
        data?.filter((f) => f.feedback_rating === -1).length || 0;
      const satisfactionRate =
        totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;

      const stats = {
        totalFeedback,
        positiveCount,
        negativeCount,
        satisfactionRate: Math.round(satisfactionRate * 100) / 100,
      };

      console.log("Calculated stats:", stats);
      logger.info("Feedback stats retrieved", { agentId, stats });

      return stats;
    } catch (error) {
      logger.error("Error getting feedback stats", { error });
      console.error("Exception in getFeedbackStats:", error);
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
