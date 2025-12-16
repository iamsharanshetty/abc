// lib/services/promptTemplate.ts
import { AgentRole } from "@/types/agent";

export interface PromptContext {
  websiteUrl: string;
  companyName: string;
  websiteContent: string; // Summary of website content
  agentRole: AgentRole;
  agentName: string;
  tone?: "professional" | "friendly" | "casual";
}

export class PromptTemplateService {
  /**
   * Generate system prompt for the AI agent
   */
  static generateSystemPrompt(context: PromptContext): string {
    const roleInstructions = this.getRoleInstructions(context.agentRole);
    const toneInstructions = this.getToneInstructions(
      context.tone || "professional"
    );

    return `You are ${context.agentName}, an AI assistant for ${context.companyName}.

COMPANY CONTEXT:
${context.websiteContent}

YOUR ROLE:
${roleInstructions}

COMMUNICATION STYLE:
${toneInstructions}

CAPABILITIES:
- Answer questions about ${context.companyName}'s products, services, and policies
- Provide helpful information based on the company's website content
- Capture lead information when users express interest
- Escalate complex issues when needed

LEAD CAPTURE TRIGGERS:
When a user expresses interest (e.g., "I want a demo", "Tell me more", "I'm interested", "Can someone contact me"), politely ask for:
1. Their name
2. Email address
3. Any specific requirements or questions

IMPORTANT GUIDELINES:
- Always stay in character as ${context.agentName}
- Only provide information you have context for
- If you don't know something, politely say so and offer to connect them with the team
- Be helpful, concise, and professional
- Never make up information
- Respect user privacy

RESPONSE FORMAT:
- Keep responses conversational and natural
- Use line breaks for readability
- When capturing leads, ask one question at a time
- Confirm information before saving`;
  }

  /**
   * Get role-specific instructions
   */
  private static getRoleInstructions(role: AgentRole): string {
    const instructions = {
      sales: `You are a Sales Representative focused on:
- Understanding customer needs and pain points
- Highlighting relevant product features and benefits
- Overcoming objections professionally
- Moving conversations toward demos or trials
- Capturing qualified leads for the sales team`,

      support: `You are a Customer Support Agent focused on:
- Resolving customer issues and answering questions
- Providing step-by-step troubleshooting guidance
- Explaining product features and usage
- Creating support tickets for complex issues
- Ensuring customer satisfaction`,

      custom: `You are a versatile AI Assistant focused on:
- Providing accurate information about the company
- Assisting users with their specific needs
- Maintaining a helpful and professional demeanor
- Adapting your approach based on user requirements`,
    };

    return instructions[role] || instructions.custom;
  }

  /**
   * Get tone-specific instructions
   */
  private static getToneInstructions(
    tone: "professional" | "friendly" | "casual"
  ): string {
    const instructions = {
      professional: `Maintain a professional and courteous tone:
- Use formal language and proper grammar
- Address users respectfully
- Keep responses clear and structured`,

      friendly: `Use a warm and approachable tone:
- Be conversational while staying professional
- Use friendly language without being overly casual
- Show empathy and understanding`,

      casual: `Adopt a relaxed and conversational tone:
- Use everyday language
- Be personable and relatable
- Keep things light while staying helpful`,
    };

    return instructions[tone];
  }

  /**
   * Generate a contextualized user prompt with relevant information
   */
  static generateContextualPrompt(
    userMessage: string,
    relevantContext: string[]
  ): string {
    if (relevantContext.length === 0) {
      return userMessage;
    }

    return `Context from our website:
${relevantContext.map((ctx, i) => `[${i + 1}] ${ctx}`).join("\n\n")}

User Question: ${userMessage}

Please answer the user's question using the context provided above. If the context doesn't contain relevant information, politely let the user know.`;
  }

  /**
   * Detect if user message indicates interest/lead capture opportunity
   */
  static detectLeadIntent(message: string): boolean {
    const leadKeywords = [
      "demo",
      "trial",
      "pricing",
      "quote",
      "contact",
      "interested",
      "call me",
      "reach out",
      "get in touch",
      "sign up",
      "more information",
      "schedule",
      "meeting",
      "consultation",
      "buy",
      "purchase",
    ];

    const lowerMessage = message.toLowerCase();
    return leadKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Generate lead capture prompt
   */
  static generateLeadCapturePrompt(
    stage: "initial" | "name" | "email" | "confirm"
  ): string {
    const prompts = {
      initial:
        "I'd be happy to help you with that! To ensure someone from our team can follow up with you properly, could you please share your name?",

      name: "Thank you! And what's the best email address to reach you at?",

      email:
        "Perfect! Is there anything specific you'd like our team to know about your interest or requirements?",

      confirm:
        "Great! I've captured your information. Someone from our team will reach out to you shortly. Is there anything else I can help you with in the meantime?",
    };

    return prompts[stage];
  }
}
