// lib/services/langchainService.ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";
import { AgentContext } from "./aiAgent";

/**
 * LangChain-based AI Agent Service
 * Wraps OpenAI with LangChain for better prompt management and chain composition
 */
export class LangChainService {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 500,
      openAIApiKey: config.openai.apiKey,
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

    // Build the base prompt with ALL variables as placeholders
    let templateString = `You are an AI assistant for a website. Your role is: {role}.`;

    // Conditionally add persona section
    templateString += `\n\nPersona: {persona}`;

    // Conditionally add tone section
    templateString += `\n\nTone: {tone}`;

    // Add role-specific instructions based on role type
    if (role === "sales") {
      templateString += `\n\nYour goal is to help potential customers understand the product/service and guide them toward making a purchase. Be helpful, persuasive, and professional. When you sense interest, ask for contact information to follow up.`;
    } else if (role === "support") {
      templateString += `\n\nYour goal is to help users solve problems and answer their questions about the product/service. Be patient, clear, and helpful.`;
    } else if (role === "training") {
      templateString += `\n\nYour goal is to educate users about how to use the product/service effectively. Be clear, instructive, and encouraging.`;
    } else {
      templateString += `\n\nYour goal is to assist users with their questions and provide helpful information.`;
    }

    // Add context retrieval section
    templateString += `\n\nRelevant information from the website:\n{context}`;

    // Add lead capture instructions
    templateString += `\n\nIMPORTANT: If the user expresses interest (e.g., wants a demo, quote, more information, or to purchase), politely ask for their contact information. Say something like: "I'd be happy to help you with that! Could you please share your name and email so our team can follow up with you?"`;

    // Add fallback instructions
    templateString += `\n\nIf you don't have information about something, politely say: "I don't have that specific information right now, but I'd be happy to connect you with someone who can help. Would you like to share your contact details?"`;

    // Add conversation history section
    templateString += `\n\nPrevious conversation:\n{conversationHistory}`;

    // Current user message
    templateString += `\n\nUser: {userMessage}\n\nAssistant:`;

    // Define all input variables that will be provided
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
   */
  private createAgentChain(context: AgentContext) {
    const { template, inputVariables } = this.buildSystemPromptTemplate(context);
    const defaults = this.getDefaultValues(context);

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
      this.model,
      new StringOutputParser(),
    ]);

    return chain;
  }

  /**
   * Generate agent response using LangChain
   */
  async generateResponse(
    context: AgentContext,
    userMessage: string,
    relevantContext: string[]
  ): Promise<string> {
    try {
      const chain = this.createAgentChain(context);

      // Format inputs
      const contextText =
        relevantContext.length > 0
          ? relevantContext.join("\n\n")
          : "No specific information available.";

      const conversationHistoryText = this.formatConversationHistory(
        context.conversationHistory
      );

      logger.debug("Invoking LangChain agent", {
        contextLength: contextText.length,
        historyLength: conversationHistoryText.length,
        role: context.role,
      });

      // Invoke the chain with properly mapped inputs
      const response = await chain.invoke({
        context: contextText,
        conversationHistory: conversationHistoryText,
        userMessage: userMessage,
      });

      return response;
    } catch (error) {
      logger.error("Error in LangChain generation", { error });
      throw error;
    }
  }

  /**
   * Batch generate responses (for testing multiple questions)
   */
  async batchGenerate(
    context: AgentContext,
    questions: string[],
    relevantContext: string[]
  ): Promise<string[]> {
    try {
      const chain = this.createAgentChain(context);

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
   */
  async streamResponse(
    context: AgentContext,
    userMessage: string,
    relevantContext: string[],
    onToken: (token: string) => void
  ): Promise<void> {
    try {
      const chain = this.createAgentChain(context);

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