// lib/services/aiAgent.ts - OPTIMIZED VERSION
// ✅ FIXED: Hybrid intent detection (keywords first, LLM fallback with caching)

import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config";
import { CacheService } from "./cache";
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

/**
 * Statistics for intent detection performance
 */
interface IntentDetectionStats {
  method:
    | "strong_keyword"
    | "negative_keyword"
    | "cached"
    | "moderate_keyword"
    | "llm_fallback";
  hasIntent: boolean;
  duration: number; // milliseconds
}

export class AIAgentService {
  private _langChainService: LangChainService;
  private crmService: CRMService;

  constructor() {
    this._langChainService = new LangChainService();
    this.crmService = new CRMService();
  }

  /**
   * Search for relevant context from website embeddings
   */
  private async searchContext(
    websiteUrl: string,
    query: string,
    settings?: AgentSettings
  ): Promise<string[]> {
    try {
      const supabase = await createClient();

      const contextRetrievalCount = settings?.contextRetrievalCount || 5;
      const matchThreshold = settings?.matchThreshold || 0.7;

      const validatedCount = Math.min(Math.max(contextRetrievalCount, 1), 10);
      const validatedThreshold = Math.min(Math.max(matchThreshold, 0.5), 0.9);

      logger.debug("Context search with configurable parameters", {
        websiteUrl,
        count: validatedCount,
        threshold: validatedThreshold,
        fromSettings: !!settings,
      });

      const queryEmbedding = await openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: query,
      });

      const embeddingVector = queryEmbedding.data[0].embedding;
      const embeddingString = `[${embeddingVector.join(",")}]`;

      const { data, error } = await supabase.rpc("match_website_content", {
        query_embedding: embeddingString,
        match_threshold: validatedThreshold,
        match_count: validatedCount,
        website_url_filter: websiteUrl,
      });

      if (error) {
        logger.error("Error searching context", { error, websiteUrl });
        return [];
      }

      const results = data?.map((item: any) => item.content_section) || [];

      logger.debug("Context search completed", {
        resultsCount: results.length,
        requestedCount: validatedCount,
      });

      return results;
    } catch (error) {
      logger.error("Error in searchContext", { error });
      return [];
    }
  }

  /**
   * Extract lead data from user message
   */
  private extractLeadData(message: string): Partial<LeadData> | null {
    const leadData: Partial<LeadData> = {};
    let hasValidData = false;

    // Email validation
    const emailRegex =
      /\b[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/g;
    const emails = message.match(emailRegex);

    if (emails && emails.length > 0) {
      const email = emails[0].toLowerCase();
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

    // Phone validation
    try {
      const phonePatterns = [
        /(?:\+1\s?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
        /\+[0-9]{1,3}[\s.-]?(?:\([0-9]{1,4}\)|[0-9]{1,4})[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{3,4}/g,
        /\b[0-9]{10,11}\b/g,
      ];

      let bestPhoneMatch: string | null = null;

      for (const pattern of phonePatterns) {
        const matches = message.match(pattern);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            try {
              if (isValidPhoneNumber(match, "US")) {
                const phoneNumber = parsePhoneNumber(match, "US");
                bestPhoneMatch = phoneNumber.formatInternational();
                break;
              }
              if (isValidPhoneNumber(match)) {
                const phoneNumber = parsePhoneNumber(match);
                bestPhoneMatch = phoneNumber.formatInternational();
                break;
              }
            } catch (e) {
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

    // Name extraction
    const namePatterns = [
      /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:\s+here|\s+speaking)/i,
      /^([a-z]+)\.([a-z]+)@/i,
    ];

    for (const pattern of namePatterns) {
      const nameMatch = message.match(pattern);
      if (nameMatch) {
        let extractedName = nameMatch[1];

        if (pattern.toString().includes("@")) {
          extractedName = `${nameMatch[1]} ${nameMatch[2]}`;
          extractedName = extractedName
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        }

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

    if (leadData.email && !leadData.name) {
      const emailLocalPart = leadData.email.split("@")[0];

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

    // Company extraction
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
   * ✅ OPTIMIZED: Hybrid intent detection with 3-tier approach
   *
   * Performance improvements:
   * - Tier 1: Strong keywords (instant, 0 API calls)
   * - Tier 2: Negative keywords (instant, 0 API calls)
   * - Tier 3: Cache check (instant, 0 API calls)
   * - Tier 4: Moderate keywords (instant, 0 API calls)
   * - Tier 5: LLM fallback (slow, costs money) - ONLY when necessary
   *
   * Expected reduction: 70-80% fewer LLM calls
   */
  private async detectInterestSignal(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<boolean> {
    const startTime = Date.now();
    const lowerMessage = message.toLowerCase();

    try {
      // ============================================
      // TIER 1: Strong keyword detection (INSTANT)
      // ============================================
      // These are unambiguous signals - no LLM needed
      const hasStrongKeyword = config.intentDetection.strongKeywords.some(
        (keyword) => lowerMessage.includes(keyword)
      );

      if (hasStrongKeyword) {
        const duration = Date.now() - startTime;
        logger.info("Intent detected via strong keyword", {
          messagePreview: message.substring(0, 50),
          method: "strong_keyword",
          duration: duration + "ms",
          hasIntent: true,
        });
        return true;
      }

      // ============================================
      // TIER 2: Negative keyword detection (INSTANT)
      // ============================================
      // User explicitly declining - no LLM needed
      const hasNegativeKeyword = config.intentDetection.negativeKeywords.some(
        (keyword) => lowerMessage.includes(keyword)
      );

      if (hasNegativeKeyword) {
        const duration = Date.now() - startTime;
        logger.info("Intent rejected via negative keyword", {
          messagePreview: message.substring(0, 50),
          method: "negative_keyword",
          duration: duration + "ms",
          hasIntent: false,
        });
        return false;
      }

      // ============================================
      // TIER 3: Cache check (INSTANT)
      // ============================================
      // Check if we've seen this or similar message before
      const cached = CacheService.getCachedIntent(message);
      if (cached) {
        const duration = Date.now() - startTime;
        logger.info("Intent detection via cache", {
          messagePreview: message.substring(0, 50),
          method: "cached",
          originalMethod: cached.method,
          duration: duration + "ms",
          hasIntent: cached.hasIntent,
        });
        return cached.hasIntent;
      }

      // ============================================
      // TIER 4: Moderate keyword heuristic (INSTANT)
      // ============================================
      // Presence of moderate keywords suggests intent, but not definitive
      const hasModerateKeyword = config.intentDetection.moderateKeywords.some(
        (keyword) => lowerMessage.includes(keyword)
      );

      // If no moderate keywords, probably not interested - skip LLM
      if (!hasModerateKeyword) {
        const duration = Date.now() - startTime;
        logger.debug("No intent signals detected, skipping LLM", {
          messagePreview: message.substring(0, 50),
          method: "moderate_keyword",
          duration: duration + "ms",
          hasIntent: false,
        });
        // Cache the negative result
        CacheService.cacheIntent(message, false, "keyword");
        return false;
      }

      // ============================================
      // TIER 5: LLM fallback (SLOW, COSTS MONEY)
      // ============================================
      // Only called when:
      // 1. Message has moderate keyword (suggests possible intent)
      // 2. Not in cache
      // 3. No strong/negative keywords
      logger.debug(
        "Moderate keyword detected, using LLM for nuanced analysis",
        {
          messagePreview: message.substring(0, 50),
        }
      );

      const hasIntent = await this.detectInterestWithLLM(
        message,
        conversationHistory
      );

      const duration = Date.now() - startTime;
      logger.info("Intent detected via LLM", {
        messagePreview: message.substring(0, 50),
        method: "llm_fallback",
        duration: duration + "ms",
        hasIntent,
      });

      // Cache the result
      CacheService.cacheIntent(message, hasIntent, "llm");

      return hasIntent;
    } catch (error) {
      logger.warn("Intent detection failed, using keyword fallback", {
        error: error instanceof Error ? error.message : String(error),
      });
      // If LLM fails, fall back to simple keyword check
      return this.detectInterestSignalFallback(message);
    }
  }

  /**
   * ✅ NEW: Separated LLM-based detection for clarity
   */
  private async detectInterestWithLLM(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<boolean> {
    const recentHistory = conversationHistory.slice(-3);
    const historyContext = recentHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = `You are an expert at detecting customer purchase intent in conversations.

Conversation history:
${historyContext || "No previous conversation"}

Current user message: "${message}"

Analyze if the user is expressing interest in:
1. Purchasing or buying a product or service
2. Getting a demo, quote, or pricing information  
3. Scheduling a call or meeting with sales
4. Requesting more information with clear intent to buy
5. Any form of commercial engagement or next steps

Respond with ONLY "YES" or "NO" based on whether the user shows clear purchase intent.

Important:
- If the user is just asking general questions without intent to engage commercially, respond "NO"
- If the user is declining or saying they don't want something, respond "NO"
- Only respond "YES" if there's genuine interest in moving forward

Answer:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 10,
    });

    const answer = response.choices[0].message.content?.trim().toUpperCase();
    return answer === "YES";
  }

  /**
   * Fallback keyword-based detection (safety net)
   */
  private detectInterestSignalFallback(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    const keywords = [
      "buy",
      "purchase",
      "order",
      "checkout",
      "payment",
      "demo",
      "demonstration",
      "trial",
      "test",
      "preview",
      "quote",
      "pricing",
      "price",
      "cost",
      "how much",
      "interested",
      "more information",
      "contact",
      "talk to",
      "schedule",
      "sign up",
      "register",
      "need",
      "want",
    ];

    const hasKeyword = keywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (hasKeyword) {
      logger.debug("Fallback keyword detection triggered", {
        message: lowerMessage.substring(0, 50),
      });
    }

    return hasKeyword;
  }

  /**
   * Main chat function
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

      const supabase = await createClient();
      const { data: agent } = await supabase
        .from("agents")
        .select("settings")
        .eq("id", context.agentId)
        .single();

      const settings = agent?.settings as AgentSettings | undefined;

      if (settings) {
        logger.debug("Using agent-specific settings", {
          agentId: context.agentId,
          contextCount: settings.contextRetrievalCount,
          matchThreshold: settings.matchThreshold,
        });
      }

      const relevantContent = await this.searchContext(
        context.websiteUrl,
        userMessage,
        settings
      );

      logger.debug("Context retrieved", {
        contentCount: relevantContent.length,
      });

      // ✅ Use optimized intent detection
      const hasInterestSignal = await this.detectInterestSignal(
        userMessage,
        context.conversationHistory
      );

      const extractedLeadData = this.extractLeadData(userMessage);

      const modelSettings = settings
        ? {
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          }
        : undefined;

      const assistantResponse = await this._langChainService.generateResponse(
        context,
        userMessage,
        relevantContent,
        modelSettings
      );

      await this.saveConversation(
        conversationId,
        context.agentId,
        userMessage,
        assistantResponse
      );

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
            this.sendLeadNotifications(
              leadId,
              context.agentId,
              extractedLeadData,
              conversationId
            ).catch((err: Error) => {
              logger.error("Error sending lead notifications", { err });
            });
          }
        }
      }

      logger.info("Chat completed", {
        conversationId,
        leadDetected,
        hasLeadData: !!extractedLeadData,
        hasInterestSignal,
      });

      return {
        response: assistantResponse,
        leadDetected,
        leadData: extractedLeadData || undefined,
        context: relevantContent,
      };
    } catch (error) {
      logger.error("Error in agent chat", { error });

      return {
        response:
          "I'm having trouble processing your request right now. Please try again in a moment, or feel free to contact our team directly.",
        leadDetected: false,
      };
    }
  }

  // [Rest of the methods remain unchanged - saveConversation, saveLead, etc.]
  // ... (keeping them the same to stay within response limits)

  /**
   * Public accessors for streaming support
   */
  public async searchContextPublic(
    websiteUrl: string,
    query: string,
    settings?: AgentSettings
  ): Promise<string[]> {
    return this.searchContext(websiteUrl, query, settings);
  }

  public async detectInterestSignalPublic(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<boolean> {
    return this.detectInterestSignal(message, conversationHistory);
  }

  public extractLeadDataPublic(message: string): Partial<LeadData> | null {
    return this.extractLeadData(message);
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
      const supabase = createServiceClient();

      const { error } = await supabase.from("conversations").insert({
        id: conversationId,
        agent_id: agentId,
        user_message: userMessage,
        assistant_response: assistantResponse,
        metadata: {},
      });

      if (error) {
        logger.error("Error saving conversation", { error });
      }
    } catch (error) {
      logger.error("Exception saving conversation", { error });
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
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from("leads")
        .insert({
          agent_id: agentId,
          conversation_id: conversationId,
          name: leadData.name || null,
          email: leadData.email || null,
          phone: leadData.phone || null,
          company: leadData.company || null,
          interest: leadData.interest || null,
          status: "new",
          metadata: {},
        })
        .select()
        .single();

      if (error) {
        logger.error("Error saving lead", { error });
        return null;
      }

      logger.info("Lead saved", { leadId: data.id, agentId });
      return data.id;
    } catch (error) {
      logger.error("Exception saving lead", { error });
      return null;
    }
  }

  /**
   * Send lead notifications (webhook and CRM)
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
        .select("name, settings")
        .eq("id", agentId)
        .single();

      if (!agent) {
        logger.error("Agent not found for lead notifications", { agentId });
        return;
      }

      const settings = agent.settings as any;

      // Prepare full lead data
      const fullLeadData: LeadData = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        interest: leadData.interest,
        capturedAt: new Date().toISOString(),
        conversationId,
      };

      // Send to webhook if configured
      if (settings?.webhookEnabled && settings?.webhookUrl) {
        try {
          await this.sendLeadToWebhook(settings.webhookUrl, fullLeadData);

          await supabase
            .from("leads")
            .update({
              sent_to_webhook: true,
              webhook_sent_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        } catch (error) {
          logger.error("Error sending to webhook", { error });
        }
      }

      // Send to CRM if configured
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
      const supabase = createServiceClient();

      logger.debug("Submitting feedback", {
        conversationId,
        rating,
        hasComment: !!comment,
      });

      // First, check if conversation exists
      const { data: existingConv, error: checkError } = await supabase
        .from("conversations")
        .select("id, agent_id")
        .eq("id", conversationId)
        .single();

      logger.debug("Existing conversation check", {
        found: !!existingConv,
        hasError: !!checkError,
      });

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

      logger.debug("Feedback update result", {
        success: !!data && !error,
        hasError: !!error,
      });

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
      const supabase = createServiceClient();

      logger.debug("Getting feedback stats", { agentId });

      // First, check if agent exists
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id, name")
        .eq("id", agentId)
        .single();

      logger.debug("Agent lookup for feedback stats", {
        found: !!agent,
        hasError: !!agentError,
      });

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

      logger.debug("Feedback data retrieved", {
        count: data?.length || 0,
        hasError: !!error,
      });

      if (error) {
        logger.error("Error getting feedback stats", { error, agentId });
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

      logger.info("Feedback stats retrieved", { agentId, stats });

      return stats;
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

  /**
   * ✅ PUBLIC VERSION: Save conversation for public/embedded chat (no auth required)
   * Used by the public chat widget endpoint
   */
  async saveConversationPublic(
    conversationId: string,
    agentId: string,
    userMessage: string,
    assistantResponse: string
  ): Promise<boolean> {
    try {
      const supabase = createServiceClient();

      logger.debug("Saving public conversation", {
        conversationId,
        agentId,
        messageLength: userMessage.length,
        responseLength: assistantResponse.length,
      });

      const { error } = await supabase.from("conversations").insert({
        id: conversationId,
        agent_id: agentId,
        user_message: userMessage,
        assistant_response: assistantResponse,
        metadata: {
          source: "public_chat",
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        logger.error("Error saving public conversation", { error, conversationId });
        return false;
      }

      logger.info("Public conversation saved", { conversationId, agentId });
      return true;
    } catch (error) {
      logger.error("Error in saveConversationPublic", { error });
      return false;
    }
  }

  /**
   * ✅ PUBLIC VERSION: Save lead for public/embedded chat (no auth required)
   * Used by the public chat widget endpoint
   */
  async saveLeadPublic(
    conversationId: string,
    agentId: string,
    leadData: Partial<LeadData>
  ): Promise<string | null> {
    try {
      const supabase = createServiceClient();

      logger.debug("Saving public lead", {
        conversationId,
        agentId,
        hasEmail: !!leadData.email,
        hasPhone: !!leadData.phone,
        hasName: !!leadData.name,
      });

      // Prepare lead data
      const fullLeadData: Partial<LeadData> = {
        ...leadData,
        conversationId,
        capturedAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("leads")
        .insert({
          agent_id: agentId,
          conversation_id: conversationId,
          name: fullLeadData.name || null,
          email: fullLeadData.email || null,
          phone: fullLeadData.phone || null,
          company: fullLeadData.company || null,
          interest: fullLeadData.interest || null,
          captured_at: fullLeadData.capturedAt,
          status: "new",
          metadata: {
            source: "public_chat",
            captured_at: fullLeadData.capturedAt,
          },
        })
        .select("id")
        .single();

      if (error) {
        logger.error("Error saving public lead", { error, conversationId });
        return null;
      }

      logger.info("Public lead saved", {
        leadId: data.id,
        conversationId,
        agentId,
      });

      return data.id;
    } catch (error) {
      logger.error("Error in saveLeadPublic", { error });
      return null;
    }
  }

  /**
   * ✅ PUBLIC VERSION: Send lead notifications for public/embedded chat (no auth required)
   * Used by the public chat widget endpoint
   */
  async sendLeadNotificationsPublic(
    leadId: string,
    agentId: string,
    leadData: Partial<LeadData>,
    conversationId: string
  ): Promise<void> {
    try {
      const supabase = createServiceClient();

      logger.debug("Sending public lead notifications", { leadId, agentId });

      // Get agent details and settings
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("name, settings")
        .eq("id", agentId)
        .single();

      if (agentError || !agent) {
        logger.error("Agent not found for public lead notifications", {
          agentId,
          error: agentError,
        });
        return;
      }

      const settings = agent.settings as AgentSettings;

      // Prepare full lead data
      const fullLeadData: LeadData = {
        name: leadData.name || "",
        email: leadData.email || "",
        phone: leadData.phone || "",
        company: leadData.company || "",
        interest: leadData.interest || "",
        capturedAt: leadData.capturedAt || new Date().toISOString(),
        conversationId,
      };

      // Send to webhook if configured
      if (settings?.webhookEnabled && settings?.webhookUrl) {
        try {
          await this.sendLeadToWebhook(settings.webhookUrl, fullLeadData);

          await supabase
            .from("leads")
            .update({
              sent_to_webhook: true,
              webhook_sent_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        } catch (error) {
          logger.error("Error sending to webhook in public notifications", {
            error,
          });
        }
      }

      // Send to CRM if configured
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
          logger.error("Error syncing to CRM in public notifications", {
            error,
          });
        }
      }

      logger.info("Public lead notifications completed", { leadId });
    } catch (error) {
      logger.error("Error in sendLeadNotificationsPublic", { error });
    }
  }

  }

  // Also expose the LangChain service
  public get langChainService(): LangChainService {
    // ✅ Add return type
    return this._langChainService; // ✅ Use underscore
  }
}