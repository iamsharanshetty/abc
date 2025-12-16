// lib/services/promptTemplate.ts
import { logger } from "@/lib/utils/logger";
import { AgentRole } from "@/types/agent";

export interface PromptContext {
  websiteUrl: string;
  companyName: string;
  websiteContent: string;
  agentRole: AgentRole;
  agentName: string;
  tone?: "professional" | "friendly" | "casual";
}

export class PromptTemplateService {
  static generateSystemPrompt(context: PromptContext): string {
    const toneInstructions = this.getToneInstructions(context.tone || "professional");
    const roleInstructions = this.getRoleInstructions(context.agentRole);

    return `You are ${context.agentName}, an AI assistant for ${context.companyName}.

**Your Role:** ${roleInstructions}

**Company Information:**
Website: ${context.websiteUrl}
${context.websiteContent}

**Communication Style:** ${toneInstructions}

**Important Instructions:**
1. Stay on topic and only answer questions related to ${context.companyName}
2. If you don't know something, admit it honestly and offer to help find the information
3. Be concise but thorough in your responses
4. When users express interest in products/services, politely ask if they'd like to leave their contact information
5. Always maintain a ${context.tone || "professional"} tone

**Lead Capture Triggers:**
- User asks for pricing, quotes, or demos
- User expresses interest in purchasing or learning more
- User asks "how can I get started" or similar phrases

When triggered, smoothly transition to collecting their information without being pushy.`;
  }

  static generateContextualPrompt(
    userQuery: string,
    relevantContext: string[]
  ): string {
    if (relevantContext.length === 0) {
      return userQuery;
    }

    return `Based on the following information from our website:

${relevantContext.join("\n\n")}

Please answer this question: ${userQuery}`;
  }

  static generateLeadCapturePrompt(
    stage: "initial" | "name" | "email" | "notes" | "confirm"
  ): string {
    switch (stage) {
      case "initial":
        return "I'd be happy to help you further! May I get your name?";

      case "name":
        return "Great! And what's the best email address to reach you at?";

      case "email":
        return "Perfect! Is there anything specific you'd like us to know about your needs?";

      case "confirm":
        return "Thank you! I've recorded your information and someone from our team will reach out to you shortly. Is there anything else I can help you with today?";

      default:
        return "How can I assist you today?";
    }
  }

  static detectLeadIntent(message: string): boolean {
    const leadKeywords = [
      "pricing",
      "price",
      "cost",
      "quote",
      "demo",
      "trial",
      "buy",
      "purchase",
      "get started",
      "sign up",
      "contact",
      "reach out",
      "talk to sales",
      "speak with",
      "consultation",
      "interested in",
    ];

    const lowercaseMessage = message.toLowerCase();
    return leadKeywords.some((keyword) =>
      lowercaseMessage.includes(keyword)
    );
  }

  private static getToneInstructions(
    tone: "professional" | "friendly" | "casual"
  ): string {
    switch (tone) {
      case "professional":
        return "Maintain a professional and business-appropriate tone. Use proper grammar and avoid slang.";

      case "friendly":
        return "Be warm and approachable while remaining professional. Use conversational language and show genuine interest.";

      case "casual":
        return "Keep it relaxed and conversational. You can use contractions and informal language, but always be respectful.";

      default:
        return "Maintain a professional tone.";
    }
  }

  private static getRoleInstructions(role: AgentRole): string {
    switch (role) {
      case "sales":
        return "Your primary goal is to help potential customers understand our products/services and guide them toward making a purchase decision. Be persuasive but not pushy.";

      case "support":
        return "Your primary goal is to help customers solve problems and answer their questions. Be patient, clear, and solution-oriented.";

      case "faq":
        return "Your primary goal is to quickly and accurately answer frequently asked questions. Be concise and provide relevant links when helpful.";

      default:
        return "Your goal is to assist users with their inquiries about our company.";
    }
  }
}