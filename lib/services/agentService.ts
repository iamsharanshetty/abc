// lib/services/agentService.ts
import { ChatService, ChatMessage } from "./chatService";
import { PromptTemplateService, PromptContext } from "./promptTemplate";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { AgentRole } from "@/types/agent";

export interface AgentConfig {
  id: string;
  name: string;
  websiteUrl: string;
  role: AgentRole;
  tone?: "professional" | "friendly" | "casual";
  systemPrompt?: string;
}

export interface ConversationState {
  sessionId: string;
  messages: ChatMessage[];
  leadCapture?: {
    stage: "initial" | "name" | "email" | "notes" | "confirm";
    data: {
      name?: string;
      email?: string;
      notes?: string;
    };
  };
}

export class AgentService {
  private config: AgentConfig;
  private conversationState: ConversationState;

  constructor(config: AgentConfig) {
    this.config = config;
    this.conversationState = {
      sessionId: this.generateSessionId(),
      messages: [],
    };
  }

  /**
   * Initialize agent with system prompt
   */
  async initialize(): Promise<void> {
    try {
      // Get website content summary
      const contentSummary = await this.getWebsiteContentSummary();

      // Generate system prompt
      const promptContext: PromptContext = {
        websiteUrl: this.config.websiteUrl,
        companyName: this.extractCompanyName(this.config.websiteUrl),
        websiteContent: contentSummary,
        agentRole: this.config.role,
        agentName: this.config.name,
        tone: this.config.tone || "professional",
      };

      const systemPrompt =
        this.config.systemPrompt ||
        PromptTemplateService.generateSystemPrompt(promptContext);

      // Add system message to conversation
      this.conversationState.messages.push({
        role: "system",
        content: systemPrompt,
      });

      logger.info("Agent initialized", {
        agentId: this.config.id,
        sessionId: this.conversationState.sessionId,
      });
    } catch (error) {
      logger.error("Error initializing agent", {
        error,
        agentId: this.config.id,
      });
      throw new Error("Failed to initialize agent");
    }
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userMessage: string): Promise<string> {
    try {
      // Validate message
      const validation = ChatService.validateMessage(userMessage);
      if (!validation.valid) {
        return `I apologize, but ${validation.error}. Please try rephrasing your message.`;
      }

      // Check if in lead capture flow
      if (this.conversationState.leadCapture) {
        return await this.handleLeadCaptureFlow(userMessage);
      }

      // Add user message to conversation
      this.conversationState.messages.push({
        role: "user",
        content: userMessage,
      });

      // Generate response
      const response = await ChatService.generateResponse(
        userMessage,
        this.conversationState.messages,
        this.config.id,
        this.config.websiteUrl
      );

      // Add assistant message to conversation
      this.conversationState.messages.push({
        role: "assistant",
        content: response.message,
      });

      // Check if lead capture should be initiated
      if (response.isLeadCapture && !this.conversationState.leadCapture) {
        this.conversationState.leadCapture = {
          stage: "initial",
          data: {},
        };

        // Return lead capture prompt
        const leadPrompt =
          PromptTemplateService.generateLeadCapturePrompt("initial");
        this.conversationState.messages.push({
          role: "assistant",
          content: leadPrompt,
        });

        return `${response.message}\n\n${leadPrompt}`;
      }

      return response.message;
    } catch (error) {
      logger.error("Error processing message", {
        error,
        agentId: this.config.id,
      });
      return this.getErrorResponse();
    }
  }

  /**
   * Handle lead capture conversation flow
   */
  private async handleLeadCaptureFlow(userMessage: string): Promise<string> {
    if (!this.conversationState.leadCapture) {
      return "Something went wrong. Let's start over.";
    }

    const { stage, data } = this.conversationState.leadCapture;

    switch (stage) {
      case "initial":
        // User provided name
        data.name = userMessage.trim();
        this.conversationState.leadCapture.stage = "name";
        return PromptTemplateService.generateLeadCapturePrompt("name");

      case "name":
        // User provided email
        if (!this.isValidEmail(userMessage.trim())) {
          return "That doesn't look like a valid email address. Could you please provide a valid email?";
        }
        data.email = userMessage.trim();
        this.conversationState.leadCapture.stage = "email";
        return PromptTemplateService.generateLeadCapturePrompt("email");

      case "email":
        // User provided additional notes
        data.notes = userMessage.trim();
        this.conversationState.leadCapture.stage = "confirm";

        // Save lead to database
        await this.captureLead(data);

        // Reset lead capture state
        this.conversationState.leadCapture = undefined;

        return PromptTemplateService.generateLeadCapturePrompt("confirm");

      default:
        this.conversationState.leadCapture = undefined;
        return "Let's start fresh. How can I help you today?";
    }
  }

  /**
   * Capture lead information to database
   */
  private async captureLead(leadData: {
    name?: string;
    email?: string;
    notes?: string;
  }): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from("leads").insert({
        agent_id: this.config.id,
        session_id: this.conversationState.sessionId,
        name: leadData.name,
        email: leadData.email,
        message: leadData.notes,
        source: "chat",
        status: "new",
        metadata: {
          websiteUrl: this.config.websiteUrl,
          capturedAt: new Date().toISOString(),
        },
      });

      logger.info("Lead captured", {
        agentId: this.config.id,
        email: leadData.email,
      });
    } catch (error) {
      logger.error("Error capturing lead", { error, leadData });
      throw error;
    }
  }

  /**
   * Get website content summary from vector store
   */
  private async getWebsiteContentSummary(): Promise<string> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("website_embeddings")
        .select("content_section, metadata")
        .eq("website_url", this.config.websiteUrl)
        .limit(10);

      if (error || !data || data.length === 0) {
        return `Information from ${this.config.websiteUrl}`;
      }

      // Extract titles and summaries
      const summaries = data
        .map((item) => {
          const title = item.metadata?.title || "Page";
          const content = item.content_section.substring(0, 200);
          return `${title}: ${content}...`;
        })
        .join("\n\n");

      return `Website Content Summary:\n${summaries}`;
    } catch (error) {
      logger.error("Error getting content summary", { error });
      return `Information from ${this.config.websiteUrl}`;
    }
  }

  /**
   * Extract company name from URL
   */
  private extractCompanyName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split(".");
      const name = parts[parts.length - 2] || hostname;
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return "our company";
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error response for users
   */
  private getErrorResponse(): string {
    const responses = [
      "I apologize, but I'm having trouble processing that right now. Could you please try again?",
      "Something went wrong on my end. Please rephrase your question and I'll do my best to help.",
      "I'm experiencing some technical difficulties. Please try again in a moment.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationState.messages.filter(
      (msg) => msg.role !== "system"
    );
  }

  /**
   * Reset conversation
   */
  resetConversation(): void {
    const systemMessage = this.conversationState.messages[0];
    this.conversationState = {
      sessionId: this.generateSessionId(),
      messages: systemMessage ? [systemMessage] : [],
    };
  }
}
