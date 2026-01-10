// lib/services/langchainService.ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { config } from "@/lib/config"; // ✅ Client-safe config (for settings)
import { serverConfig } from "@/lib/config.server"; // ✅ ADDED: Server config (for API key)
import { logger } from "@/lib/utils/logger";
import { AgentContext } from "./aiAgent";

/**
 * LangChain-based AI Agent Service
 * Wraps OpenAI with LangChain for better prompt management and chain composition
 */
export class LangChainService {
  private apiKey: string;

  constructor() {
    // ✅ FIXED: Get API key from serverConfig instead of config
    this.apiKey = serverConfig.openai.apiKey;
  }

  /**
   * ✅ NEW: Create model instance with agent-specific settings
   */
  private createModel(settings?: {
    temperature?: number;
    maxTokens?: number;
  }): ChatOpenAI {
    return new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: settings?.temperature ?? 0.7, // Use setting or default
      maxTokens: settings?.maxTokens ?? 500, // Use setting or default
      openAIApiKey: this.apiKey, // ✅ Uses the API key from serverConfig
    });
  }

  /**
   * Build dynamic system prompt template with proper LangChain syntax
   * All placeholders must be defined as input variables
   */
  private buildSystemPromptTemplate(context: AgentContext): {
    template: string;
    inputVariables: string[];
  } {
    const { role } = context;

    let templateString = `You are an AI assistant for a website. Your role is: {role}.`;

    templateString += `\n\nPersona: {persona}`;
    templateString += `\n\nTone: {tone}`;

    // Role-specific instructions
    if (role === "sales") {
      templateString += `\n\nYour goal is to help potential customers understand the product/service and guide them toward making a purchase. Be helpful, persuasive, and professional. When you sense interest, ask for contact information to follow up.`;
    } else if (role === "support") {
      templateString += `\n\nYour goal is to help users solve problems and answer their questions about the product/service. Be patient, clear, and helpful.`;
    } else if (role === "training") {
      templateString += `\n\nYour goal is to educate users about how to use the product/service effectively. Be clear, instructive, and encouraging.`;
    } else {
      templateString += `\n\nYour goal is to assist users with their questions and provide helpful information.`;
    }

    // ✅ FIXED: More confident prompt
    templateString += `\n\n=== WEBSITE INFORMATION ===
The following is relevant information from the website that should help you answer the user's question:

{context}

IMPORTANT INSTRUCTIONS:
1. Answer questions directly and confidently using the information from the context above
2. Look for company names, product names, features, and services in the context
3. Even if the context seems partial, extract and use any relevant information you find
4. Be helpful and informative - use the information provided
5. Only say you don't have information if the context is COMPLETELY EMPTY
6. When you see company/product names in the context, use them confidently
=== END WEBSITE INFORMATION ===`;

    // Lead capture...
    templateString += `\n\nLEAD CAPTURE: If the user expresses interest (e.g., wants a demo, quote, more information, or to purchase), politely ask for their contact information.`;

    // ✅ FIXED: Less defensive fallback
    templateString += `\n\nFALLBACK RESPONSE: ONLY use this if context is completely empty: "I don't have that specific information in my knowledge base right now, but I'd be happy to connect you with someone who can help."`;

    // Add conversation history section
    templateString += `\n\nPrevious conversation:\n{conversationHistory}`;

    // Current user message
    templateString += `\n\nUser: {userMessage}\n\nAssistant:`;

    const inputVariables = [
      "role",
      "persona",
      "tone",
      "context",
      "conversationHistory",
      "userMessage",
    ];

    return {
      template: templateString,
      inputVariables,
    };
  }

  /**
   * Format conversation history for prompt
   */
  private formatConversationHistory(
    history: Array<{ role: string; content: string }>
  ): string {
    if (!history || history.length === 0) {
      return "No previous conversation.";
    }

    return history
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n");
  }

  /**
   * Get default values for optional context fields
   */
  private getDefaultValues(context: AgentContext): {
    persona: string;
    tone: string;
  } {
    return {
      persona: context.persona || "Professional and helpful assistant",
      tone: context.tone || "Friendly and informative",
    };
  }

  /**
   * Create LangChain chain for agent response with proper variable mapping
   * ✅ NOW ACCEPTS SETTINGS for dynamic model configuration
   */
  private createAgentChain(
    context: AgentContext,
    settings?: { temperature?: number; maxTokens?: number }
  ) {
    const { template, inputVariables } =
      this.buildSystemPromptTemplate(context);
    const defaults = this.getDefaultValues(context);

    // ✅ Create model with settings
    const model = this.createModel(settings);

    // Create prompt template with explicit input variables
    const promptTemplate = new PromptTemplate({
      template,
      inputVariables,
    });

    // Create the chain with proper input mapping
    const chain = RunnableSequence.from([
      // Input transformation: map external inputs to template variables
      {
        role: () => context.role,
        persona: () => defaults.persona,
        tone: () => defaults.tone,
        context: (input: any) => input.context,
        conversationHistory: (input: any) => input.conversationHistory,
        userMessage: (input: any) => input.userMessage,
      },
      promptTemplate,
      model, // ✅ Use the dynamically created model
      new StringOutputParser(),
    ]);

    return chain;
  }

  /**
   * Generate agent response using LangChain
   * ✅ NOW ACCEPTS SETTINGS parameter
   */
  async generateResponse(
    context: AgentContext,
    userMessage: string,
    relevantContext: string[],
    settings?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    try {
      const chain = this.createAgentChain(context, settings);

      // ✅ ENHANCED: Better context formatting with debugging
      let contextText = "No specific information available.";

      if (relevantContext.length > 0) {
        contextText = relevantContext.join("\n\n");

        logger.info("📚 Using retrieved context", {
          chunks: relevantContext.length,
          totalLength: contextText.length,
          preview: contextText.substring(0, 200) + "...",
        });
      } else {
        logger.warn(
          "⚠️  No context retrieved - agent will respond without website info",
          {
            userMessage: userMessage.substring(0, 50),
          }
        );
      }

      const conversationHistoryText = this.formatConversationHistory(
        context.conversationHistory
      );

      logger.debug("Invoking LangChain agent", {
        contextLength: contextText.length,
        historyLength: conversationHistoryText.length,
        role: context.role,
        temperature: settings?.temperature ?? 0.7,
        maxTokens: settings?.maxTokens ?? 500,
        hasContext: relevantContext.length > 0, // ✅ Track this
      });

      // Invoke the chain with properly mapped inputs
      const response = await chain.invoke({
        context: contextText,
        conversationHistory: conversationHistoryText,
        userMessage: userMessage,
      });

      // ✅ NEW: Detect if response indicates missing info
      const noInfoIndicators = [
        "don't have that specific information",
        "don't have information about",
        "I don't have specific information",
        "not sure about",
      ];

      const seemsLikeNoInfo = noInfoIndicators.some((indicator) =>
        response.toLowerCase().includes(indicator.toLowerCase())
      );

      if (seemsLikeNoInfo && relevantContext.length === 0) {
        logger.warn("🚨 DIAGNOSIS: Agent lacks context!", {
          userQuery: userMessage.substring(0, 50),
          contextRetrieved: 0,
          responsePreview: response.substring(0, 100),
          recommendation: "Check if embeddings exist for this website",
        });
      }

      return response;
    } catch (error) {
      logger.error("Error in LangChain generation", { error });
      throw error;
    }
  }

  /**
   * Batch generate responses (for testing multiple questions)
   * ✅ NOW ACCEPTS SETTINGS parameter
   */
  async batchGenerate(
    context: AgentContext,
    questions: string[],
    relevantContext: string[],
    settings?: { temperature?: number; maxTokens?: number } // ✅ NEW parameter
  ): Promise<string[]> {
    try {
      // ✅ Pass settings to chain creation
      const chain = this.createAgentChain(context, settings);

      const contextText =
        relevantContext.length > 0
          ? relevantContext.join("\n\n")
          : "No specific information available.";

      const conversationHistoryText = this.formatConversationHistory(
        context.conversationHistory
      );

      // Batch invoke with properly formatted inputs
      const inputs = questions.map((question) => ({
        context: contextText,
        conversationHistory: conversationHistoryText,
        userMessage: question,
      }));

      const responses = await chain.batch(inputs);

      return responses;
    } catch (error) {
      logger.error("Error in LangChain batch generation", { error });
      throw error;
    }
  }

  /**
   * Stream response (for real-time chat UIs)
   * ✅ NOW ACCEPTS SETTINGS parameter
   */
  async streamResponse(
    context: AgentContext,
    userMessage: string,
    relevantContext: string[],
    onToken: (token: string) => void,
    settings?: { temperature?: number; maxTokens?: number } // ✅ NEW parameter
  ): Promise<void> {
    try {
      // ✅ Pass settings to chain creation
      const chain = this.createAgentChain(context, settings);

      const contextText =
        relevantContext.length > 0
          ? relevantContext.join("\n\n")
          : "No specific information available.";

      const conversationHistoryText = this.formatConversationHistory(
        context.conversationHistory
      );

      const stream = await chain.stream({
        context: contextText,
        conversationHistory: conversationHistoryText,
        userMessage: userMessage,
      });

      for await (const chunk of stream) {
        onToken(chunk);
      }
    } catch (error) {
      logger.error("Error in LangChain streaming", { error });
      throw error;
    }
  }
}
