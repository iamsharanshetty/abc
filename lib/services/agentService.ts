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

  async initialize(): Promise<void> {
    try {
      const contentSummary = await this.getWebsiteContentSummary();

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

  async processMessage(userMessage: string): Promise<string> {
    try {
      const validation = ChatService.validateMessage(userMessage);
      if (!validation.valid) {
        return `I apologize, but ${validation.error}. Please try rephrasing your message.`;
      }

      if (this.conversationState.leadCapture) {
        return await this.handleLeadCaptureFlow(userMessage);
      }

      this.conversationState.messages.push({
        role: "user",
        content: userMessage,
      });

      const response = await ChatService.generateResponse(
        userMessage,
        this.conversationState.messages,
        this.config.id,
        this.config.websiteUrl
      );

      this.conversationState.messages.push({
        role: "assistant",
        content: response.message,
      });

      if (response.isLeadCapture && !this.conversationState.leadCapture) {
        this.conversationState.leadCapture = {
          stage: "initial",
          data: {},
        };

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

  private async handleLeadCaptureFlow(userMessage: string): Promise<string> {
    if (!this.conversationState.leadCapture) {
      return "Something went wrong. Let's start over.";
    }

    const { stage, data } = this.conversationState.leadCapture;

    switch (stage) {
      case "initial":
        data.name = userMessage.trim();
        this.conversationState.leadCapture.stage = "name";
        return PromptTemplateService.generateLeadCapturePrompt("name");

      case "name":
        if (!this.isValidEmail(userMessage.trim())) {
          return "That doesn't look like a valid email address. Could you please provide a valid email?";
        }
        data.email = userMessage.trim();
        this.conversationState.leadCapture.stage = "email";
        return PromptTemplateService.generateLeadCapturePrompt("email");

      case "email":
        data.notes = userMessage.trim();
        this.conversationState.leadCapture.stage = "confirm";
        await this.captureLead(data);
        this.conversationState.leadCapture = undefined;
        return PromptTemplateService.generateLeadCapturePrompt("confirm");

      default:
        this.conversationState.leadCapture = undefined;
        return "Let's start fresh. How can I help you today?";
    }
  }

  private async captureLead(leadData: {
    name?: string;
    email?: string;
    notes?: string;
  }): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.from("leads").insert({
        agent_id: this.config.id,
        session_id: this.conversationState.sessionId,
        name: leadData.name || null,
        email: leadData.email || null,
        phone: null,
        company: null,
        message: leadData.notes || null,
        source: "chat",
        status: "new",
        metadata: {
          websiteUrl: this.config.websiteUrl,
          capturedAt: new Date().toISOString(),
        },
      });

      if (error) {
        logger.error("Error inserting lead", { error, leadData });
        throw error;
      }

      logger.info("Lead captured", {
        agentId: this.config.id,
        email: leadData.email,
      });
    } catch (error) {
      logger.error("Error capturing lead", { error, leadData });
      throw error;
    }
  }

  private async getWebsiteContentSummary(): Promise<string> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("website_embeddings")
        .select("content_section, metadata")
        .eq("website_url", this.config.websiteUrl)
        .limit(10);

      if (error) {
        logger.error("Error fetching website content", { error });
        return `Information from ${this.config.websiteUrl}`;
      }

      if (!data || data.length === 0) {
        return `Information from ${this.config.websiteUrl}`;
      }

      const summaries = data
        .map((item) => {
          const metadata = item.metadata as { title?: string } | null;
          const title = metadata?.title || "Page";
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getErrorResponse(): string {
    const responses = [
      "I apologize, but I'm having trouble processing that right now. Could you please try again?",
      "Something went wrong on my end. Please rephrase your question and I'll do my best to help.",
      "I'm experiencing some technical difficulties. Please try again in a moment.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationState.messages.filter(
      (msg) => msg.role !== "system"
    );
  }

  resetConversation(): void {
    const systemMessage = this.conversationState.messages[0];
    this.conversationState = {
      sessionId: this.generateSessionId(),
      messages: systemMessage ? [systemMessage] : [],
    };
  }
}