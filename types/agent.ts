// types/agent.ts - FIXED VERSION
// Import URL validation from shared utility
import { validateUrl } from "@/lib/validation";

// ============================================
// YOUR EXISTING TYPES (Keep these!)
// ============================================

export interface AgentSettings {
  name: string;
  persona: string;
  summary: string;
  role: string;
  url: string;

  // NEW: Extended settings for AI agent functionality
  // These are optional to maintain backward compatibility
  tone?: string;
  leadCaptureEnabled?: boolean;
  webhookUrl?: string;
  webhookEnabled?: boolean;
  crmEnabled?: boolean;
  crmType?: "hubspot" | "salesforce";
  notificationEmail?: string;
  contextRetrievalCount?: number; // Default: 5
  temperature?: number; // Default: 0.7
  maxTokens?: number; // Default: 500
  customInstructions?: string;
}

export interface CreateAgentResponse {
  success: boolean;
  agentId?: string;
  message?: string;
  settings?: AgentSettings;
}

export const AGENT_ROLES = [
  {
    id: "sales",
    label: "Sales Representative",
    description: "Focuses on converting leads and closing deals.",
  },
  {
    id: "support",
    label: "Customer Support",
    description: "Handles inquiries and resolves issues.",
  },
  {
    id: "custom",
    label: "Custom Persona",
    description: "Tailored to your specific needs.",
  },
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number]["id"];

export const SUGGESTED_FUNCTIONS = [
  "Product Q&A",
  "Ticket Creation",
  "Pricing Info",
  "Troubleshooting",
];

export const RECOMMENDED_AGENT_TYPE = {
  role: "support" as AgentRole,
  reason:
    "Based on your website content, a Customer Support agent is best suited to handle inquiries found on your FAQ and Contact pages.",
};

// ============================================
// NEW TYPES FOR AI AGENT SERVICE
// ============================================

/**
 * Complete agent entity from database
 */
export interface Agent {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  role: "sales" | "support" | "training" | "custom";
  system_prompt?: string;
  status: "active" | "inactive" | "training";
  settings: AgentSettings;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Request to create a new agent
 */
export interface CreateAgentRequest {
  name: string;
  website_url: string;
  role: "sales" | "support" | "training" | "custom";
  settings?: Partial<AgentSettings>;
}

/**
 * Request to update an existing agent
 */
export interface UpdateAgentRequest {
  name?: string;
  role?: "sales" | "support" | "training" | "custom";
  status?: "active" | "inactive" | "training";
  settings?: Partial<AgentSettings>;
  system_prompt?: string;
}

/**
 * Conversation message for chat history
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

/**
 * Lead data captured from conversation
 */
export interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interest?: string;
  capturedAt: string;
  conversationId: string;
}

/**
 * Feedback for a conversation
 */
export interface ConversationFeedback {
  conversationId: string;
  rating: 1 | -1; // 1 = thumbs up, -1 = thumbs down
  comment?: string;
  submittedAt?: string;
}

/**
 * Agent test result
 */
export interface AgentTestResult {
  question: string;
  response: string;
  contextFound: boolean;
  responseTime?: number;
  error?: string;
}

/**
 * Analytics summary for an agent
 */
export interface AgentAnalytics {
  agentId: string;
  timeRange: "7d" | "30d" | "90d";
  summary: {
    totalConversations: number;
    totalLeads: number;
    conversionRate: number;
    satisfactionRate: number;
    totalFeedback: number;
  };
  feedbackBreakdown: {
    positive: number;
    negative: number;
  };
  conversationsByDay: Array<{
    date: string;
    count: number;
  }>;
  statusBreakdown: Record<string, number>;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  enabled: boolean;
  events: Array<
    "lead_captured" | "conversation_started" | "conversation_ended"
  >;
  headers?: Record<string, string>;
}

/**
 * CRM integration status
 */
export interface CRMIntegrationStatus {
  hubspot: {
    configured: boolean;
    connected: boolean;
    accountName?: string;
  };
  salesforce: {
    configured: boolean;
    connected: boolean;
    note?: string;
  };
}

// ============================================
// UTILITY TYPES & HELPERS
// ============================================

/**
 * Helper to get default agent settings
 */
export const getDefaultAgentSettings = (
  url: string,
  role: string = "support"
): AgentSettings => ({
  name: "",
  persona:
    role === "sales"
      ? "Helpful sales representative focused on understanding customer needs"
      : role === "support"
      ? "Patient and knowledgeable support specialist"
      : "Friendly and professional assistant",
  summary: "",
  role,
  url,
  tone: "professional",
  leadCaptureEnabled: true,
  contextRetrievalCount: 5,
  temperature: 0.7,
  maxTokens: 500,
});

/**
 * Helper to check if a URL is valid format
 * Uses the shared validation utility
 */
export const isValidUrl = (url: string): boolean => {
  // Use the validateUrl function from lib/validation.ts
  // If it returns an empty string, the URL is valid
  const errorMessage = validateUrl(url);
  return errorMessage === "";
};

/**
 * Validate agent settings
 */
export const validateAgentSettings = (
  settings: Partial<AgentSettings>
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!settings.url) {
    errors.push("URL is required");
  }

  if (settings.url && !isValidUrl(settings.url)) {
    errors.push("Invalid URL format");
  }

  if (settings.webhookUrl && !isValidUrl(settings.webhookUrl)) {
    errors.push("Invalid webhook URL format");
  }

  if (
    settings.contextRetrievalCount &&
    (settings.contextRetrievalCount < 1 || settings.contextRetrievalCount > 10)
  ) {
    errors.push("Context retrieval count must be between 1 and 10");
  }

  if (
    settings.temperature &&
    (settings.temperature < 0 || settings.temperature > 1)
  ) {
    errors.push("Temperature must be between 0 and 1");
  }

  if (
    settings.maxTokens &&
    (settings.maxTokens < 50 || settings.maxTokens > 2000)
  ) {
    errors.push("Max tokens must be between 50 and 2000");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Map role ID to display name
 */
export const getRoleDisplayName = (roleId: string): string => {
  const role = AGENT_ROLES.find((r) => r.id === roleId);
  return role?.label || roleId;
};

/**
 * Get role-specific default persona
 */
export const getRolePersona = (roleId: string): string => {
  switch (roleId) {
    case "sales":
      return "You are a helpful sales representative who focuses on understanding customer needs and providing tailored solutions.";
    case "support":
      return "You are a patient and knowledgeable support specialist who helps users resolve issues quickly and efficiently.";
    case "custom":
      return "You are a friendly and professional assistant ready to help with any questions.";
    default:
      return "You are a helpful assistant.";
  }
};