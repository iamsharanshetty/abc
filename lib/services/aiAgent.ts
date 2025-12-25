// lib/services/aiAgent.ts - FIXED VERSION
// ✅ Fixed Issue 1: LLM-based intent detection instead of hardcoded keywords
// ✅ Fixed Issue 2: Configurable context search parameters from agent settings

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

export class AIAgentService {
  private _langChainService: LangChainService; // ✅ Renamed with underscore
  private crmService: CRMService;

  constructor() {
    this._langChainService = new LangChainService(); // ✅ Use new name
    this.crmService = new CRMService();
  }
  /**
   * ✅ FIX 2: Search for relevant context from website embeddings
   * NOW CONFIGURABLE: Uses agent settings for contextRetrievalCount and matchThreshold
   *
   * @param websiteUrl - The website to search within
   * @param query - The user's question
   * @param settings - Agent settings containing retrieval preferences (optional)
   * @returns Promise<string[]> - Array of relevant content sections
   */
  private async searchContext(
    websiteUrl: string,
    query: string,
    settings?: AgentSettings
  ): Promise<string[]> {
    try {
      const supabase = await createClient();

      // ✅ Get configurable parameters from settings with sensible defaults
      const contextRetrievalCount = settings?.contextRetrievalCount || 5;
      const matchThreshold = settings?.matchThreshold || 0.7;

      // Validate parameters to ensure they're within acceptable ranges
      const validatedCount = Math.min(Math.max(contextRetrievalCount, 1), 10); // 1-10 range
      const validatedThreshold = Math.min(Math.max(matchThreshold, 0.5), 0.9); // 0.5-0.9 range

      logger.debug("Context search with configurable parameters", {
        websiteUrl,
        count: validatedCount,
        threshold: validatedThreshold,
        fromSettings: !!settings,
      });

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
      // ✅ NOW USES CONFIGURABLE PARAMETERS
      const { data, error } = await supabase.rpc("match_website_content", {
        query_embedding: embeddingString,
        match_threshold: validatedThreshold, // ✅ Now configurable per agent
        match_count: validatedCount, // ✅ Now configurable per agent
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

      // Extract content sections from results
      return results;
    } catch (error) {
      logger.error("Error in searchContext", { error });
      return [];
    }
  }

  /**
   * Detect if user message contains lead information
   * (This method remains unchanged - it extracts actual contact info)
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
   * ✅ FIX 1: Enhanced interest signal detection with LLM-based intent classification
   *
   * This replaces simple keyword matching with AI-powered intent understanding.
   * Benefits:
   * - Understands variations: "I'd love a demonstration" = "I want a demo"
   * - Context-aware: "I don't want pricing" correctly identified as NOT interested
   * - Handles any language style or phrasing
   *
   * @param message - The user's current message
   * @param conversationHistory - Recent conversation for context
   * @returns Promise<boolean> - True if user shows purchase intent
   */
  private async detectInterestSignal(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<boolean> {
    try {
      // Quick keyword pre-filter for obvious strong signals (performance optimization)
      // This avoids unnecessary LLM calls for clear cases
      const lowerMessage = message.toLowerCase();
      const strongKeywords = [
        "buy now",
        "purchase now",
        "sign me up",
        "place an order",
        "ready to buy",
        "checkout",
        "add to cart",
      ];

      // If strong keywords are present, skip LLM call to save API costs
      if (strongKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        logger.debug("Strong keyword detected, skipping LLM intent detection", {
          message: lowerMessage.substring(0, 50),
        });
        return true;
      }

      // Use LLM for nuanced intent detection
      // Take last 3 messages for conversation context
      const recentHistory = conversationHistory.slice(-3);
      const historyContext = recentHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Construct prompt for intent classification
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

      logger.debug("Running LLM intent detection", {
        messagePreview: message.substring(0, 50),
        hasHistory: conversationHistory.length > 0,
      });

      // Call OpenAI with gpt-4o-mini (fast and cheap for classification)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0, // Deterministic output for classification
        max_tokens: 10, // We only need YES or NO
      });

      const answer = response.choices[0].message.content?.trim().toUpperCase();
      const hasIntent = answer === "YES";

      logger.info("LLM intent detection result", {
        message: message.substring(0, 50),
        hasIntent,
        answer,
        model: "gpt-4o-mini",
      });

      return hasIntent;
    } catch (error) {
      // Fallback to keyword detection if LLM fails
      // This ensures the system still works even if OpenAI API is down
      logger.warn("LLM intent detection failed, using keyword fallback", {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.detectInterestSignalFallback(message);
    }
  }

  /**
   * ✅ FIX 1: Fallback keyword-based detection if LLM is unavailable
   *
   * This is a safety net that ensures lead detection still works
   * even if the OpenAI API is down or rate-limited.
   *
   * @param message - The user's message
   * @returns boolean - True if keywords suggest interest
   */
  private detectInterestSignalFallback(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Expanded keyword list with common variations
    const keywords = [
      // Purchase intent
      "buy",
      "purchase",
      "order",
      "checkout",
      "payment",

      // Demo/trial intent
      "demo",
      "demonstration",
      "trial",
      "test",
      "preview",

      // Pricing/quote intent
      "quote",
      "pricing",
      "price",
      "cost",
      "how much",
      "what does it cost",
      "pricing information",
      "get a quote",

      // Information gathering with intent
      "interested",
      "more information",
      "learn more",
      "tell me more",
      "find out more",
      "details",

      // Contact/meeting intent
      "contact",
      "talk to",
      "speak with",
      "call",
      "email",
      "schedule",
      "book a call",
      "set up a meeting",
      "appointment",

      // Sign-up intent
      "sign up",
      "register",
      "get started",
      "join",
      "enroll",

      // Urgency signals
      "need",
      "want",
      "looking for",
      "require",
      "must have",
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
   * Main chat function - generates AI response using LangChain
   * ✅ UPDATED to use new configurable methods
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

      // ✅ FIX 2: Fetch agent settings for configurable context search
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

      // Step 1: Search for relevant context with configurable parameters
      // ✅ NOW PASSES SETTINGS for configurable search
      const relevantContent = await this.searchContext(
        context.websiteUrl,
        userMessage,
        settings // ✅ Pass settings here
      );

      logger.debug("Context retrieved", {
        contentCount: relevantContent.length,
      });

      // Step 2: Detect lead signals using LLM-based detection
      // ✅ NOW ASYNC and uses conversation history for better accuracy
      const hasInterestSignal = await this.detectInterestSignal(
        userMessage,
        context.conversationHistory
      );

      const extractedLeadData = this.extractLeadData(userMessage);

      // Step 3: Generate response using LangChain
      // ✅ Extract model parameters from settings
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
        modelSettings // ✅ Pass settings here
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
   * ✅ NEW: Public accessors for streaming support
   * These allow the chat API to call internal methods during streaming
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

  public async saveConversationPublic(
    conversationId: string,
    agentId: string,
    userMessage: string,
    assistantResponse: string
  ): Promise<void> {
    return this.saveConversation(
      conversationId,
      agentId,
      userMessage,
      assistantResponse
    );
  }

  public async saveLeadPublic(
    conversationId: string,
    agentId: string,
    leadData: Partial<LeadData>
  ): Promise<string | null> {
    return this.saveLead(conversationId, agentId, leadData);
  }

  public async sendLeadNotificationsPublic(
    leadId: string,
    agentId: string,
    leadData: Partial<LeadData>,
    conversationId: string
  ): Promise<void> {
    return this.sendLeadNotifications(
      leadId,
      agentId,
      leadData,
      conversationId
    );
  }

  // Also expose the LangChain service
  public get langChainService(): LangChainService {
    // ✅ Add return type
    return this._langChainService; // ✅ Use underscore
  }
}
