// types/agent.ts - ENHANCED VERSION
// ✅ Fixed: Aligned defaults with database schema and added comprehensive documentation

// Import URL validation from shared utility
import { validateUrl } from "@/lib/validation";

// ============================================
// AGENT SETTINGS TYPE
// ============================================

/**
 * ✅ SCHEMA ALIGNMENT DOCUMENTATION
 * ==================================
 * 
 * This type matches the 'settings' JSONB column in the 'agents' table.
 * Database schema location: See migrations or lib/database.types.ts
 * 
 * CRITICAL: When updating this type, also update:
 * 1. Database migration (if adding new fields)
 * 2. getDefaultAgentSettings() function below
 * 3. validateAgentSettings() function
 * 4. API documentation
 * 
 * DEFAULT VALUES SOURCE OF TRUTH:
 * - Defaults defined in: getDefaultAgentSettings()
 * - Database defaults: JSONB columns have no enforced defaults
 * - Application enforces defaults when creating agents
 */
export interface AgentSettings {
  // ===== REQUIRED FIELDS =====
  name: string;              // Agent display name (validated: 1-100 chars)
  persona: string;           // AI personality description (validated: 10-1000 chars)
  summary: string;           // Brief agent description (validated: 0-500 chars)
  role: string;              // One of: sales, support, training, custom
  url: string;               // Website URL to scrape (validated: valid URL format)

  // ===== OPTIONAL AI CONFIGURATION =====
  tone?: string;             // Response tone (default: "professional")
  customInstructions?: string; // Additional prompt instructions (max: 2000 chars)
  
  // ===== CONTEXT RETRIEVAL SETTINGS =====
  // These control vector similarity search behavior
  contextRetrievalCount?: number;  // Number of context chunks (default: 5, range: 1-10)
  matchThreshold?: number;         // Vector similarity threshold (default: 0.7, range: 0.5-0.9)
  
  // ===== LLM PARAMETERS =====
  temperature?: number;      // Response randomness (default: 0.7, range: 0.0-1.0)
  maxTokens?: number;        // Max response length (default: 500, range: 50-2000)
  
  // ===== LEAD CAPTURE CONFIGURATION =====
  leadCaptureEnabled?: boolean;    // Enable lead detection (default: true)
  
  // ===== INTEGRATION SETTINGS =====
  // Webhook
  webhookEnabled?: boolean;  // Enable webhook notifications (default: false)
  webhookUrl?: string;       // Webhook endpoint URL (validated if provided)
  
  // CRM
  crmEnabled?: boolean;      // Enable CRM sync (default: false)
  crmType?: "hubspot" | "salesforce"; // CRM platform (default: undefined)
  
  // Email (deprecated - use webhooks instead)
  notificationEmail?: string; // Email for notifications (validated if provided)
}

// ============================================
// DATABASE SCHEMA CONSTANTS
// ============================================

/**
 * ✅ NEW: Database schema constraints
 * These match the actual database validation rules
 */
export const AGENT_SETTINGS_CONSTRAINTS = {
  name: {
    minLength: 1,
    maxLength: 100,
    required: true,
  },
  persona: {
    minLength: 10,
    maxLength: 1000,
    required: true,
  },
  summary: {
    minLength: 0,
    maxLength: 500,
    required: true,
  },
  url: {
    required: true,
    mustBeValidUrl: true,
  },
  tone: {
    maxLength: 50,
  },
  customInstructions: {
    maxLength: 2000,
  },
  contextRetrievalCount: {
    min: 1,
    max: 10,
    default: 5,
  },
  matchThreshold: {
    min: 0.5,
    max: 0.9,
    default: 0.7,
  },
  temperature: {
    min: 0.0,
    max: 1.0,
    default: 0.7,
  },
  maxTokens: {
    min: 50,
    max: 2000,
    default: 500,
  },
  webhookUrl: {
    mustBeValidUrl: true,
  },
  notificationEmail: {
    mustBeValidEmail: true,
  },
} as const;

/**
 * ✅ NEW: Default values that match database schema
 * IMPORTANT: These are the canonical defaults used throughout the application
 */
export const AGENT_SETTINGS_DEFAULTS = {
  // AI Configuration
  tone: "professional",
  contextRetrievalCount: 5,
  matchThreshold: 0.7,
  temperature: 0.7,
  maxTokens: 500,
  
  // Features
  leadCaptureEnabled: true,
  webhookEnabled: false,
  crmEnabled: false,
} as const;

// ============================================
// AGENT ROLE CONFIGURATION
// ============================================

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
// ADDITIONAL TYPES
// ============================================

export interface CreateAgentResponse {
  success: boolean;
  agentId?: string;
  message?: string;
  settings?: AgentSettings;
}

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
// UTILITY FUNCTIONS
// ============================================

/**
 * ✅ ENHANCED: Get default agent settings with schema alignment
 * 
 * SOURCE OF TRUTH: This function provides canonical defaults for all agent settings
 * 
 * DEFAULTS ALIGNMENT:
 * - Database: JSONB column has no enforced defaults
 * - Application: This function enforces defaults
 * - Constraints: See AGENT_SETTINGS_CONSTRAINTS above
 * 
 * IMPORTANT NOTES:
 * 1. All defaults match AGENT_SETTINGS_DEFAULTS constant
 * 2. Persona varies by role (see getRolePersona())
 * 3. Required fields (name, summary) are empty strings - must be provided by user
 * 4. URL is required and validated elsewhere
 * 
 * @param url - Website URL (required, will be validated)
 * @param role - Agent role (default: "support")
 * @returns Complete AgentSettings with all defaults applied
 * 
 * @example
 * // Creating new agent
 * const settings = getDefaultAgentSettings("https://example.com", "sales");
 * // Returns settings with sales-specific persona and all defaults
 * 
 * @example
 * // Updating existing agent
 * const updated = { ...existingSettings, ...userProvidedSettings };
 * // Always merge with defaults to ensure no missing fields
 */
export const getDefaultAgentSettings = (
  url: string,
  role: string = "support"
): AgentSettings => {
  // Validate role (fallback to support if invalid)
  const validRole = AGENT_ROLES.find((r) => r.id === role)?.id || "support";

  return {
    // ===== REQUIRED FIELDS =====
    // These must be provided/updated by the user
    name: "",                    // Empty - user must provide
    summary: "",                 // Empty - user must provide
    url,                         // Provided as parameter
    role: validRole,             // Validated role
    
    // ===== AI PERSONA =====
    // Role-specific default persona
    persona: getRolePersona(validRole),
    
    // ===== AI CONFIGURATION =====
    // These match AGENT_SETTINGS_DEFAULTS
    tone: AGENT_SETTINGS_DEFAULTS.tone,
    contextRetrievalCount: AGENT_SETTINGS_DEFAULTS.contextRetrievalCount,
    matchThreshold: AGENT_SETTINGS_DEFAULTS.matchThreshold,
    temperature: AGENT_SETTINGS_DEFAULTS.temperature,
    maxTokens: AGENT_SETTINGS_DEFAULTS.maxTokens,
    
    // ===== FEATURES =====
    // These match AGENT_SETTINGS_DEFAULTS
    leadCaptureEnabled: AGENT_SETTINGS_DEFAULTS.leadCaptureEnabled,
    webhookEnabled: AGENT_SETTINGS_DEFAULTS.webhookEnabled,
    crmEnabled: AGENT_SETTINGS_DEFAULTS.crmEnabled,
    
    // ===== OPTIONAL FIELDS =====
    // Undefined by default - user can add later
    // customInstructions: undefined,
    // webhookUrl: undefined,
    // crmType: undefined,
    // notificationEmail: undefined,
  };
};

/**
 * ✅ ENHANCED: Merge user settings with defaults
 * Ensures all required fields have values and applies defaults for missing optional fields
 * 
 * @param userSettings - Partial settings from user
 * @param url - Website URL (required)
 * @param role - Agent role
 * @returns Complete settings with defaults applied
 */
export const mergeWithDefaults = (
  userSettings: Partial<AgentSettings>,
  url: string,
  role: string = "support"
): AgentSettings => {
  const defaults = getDefaultAgentSettings(url, role);
  
  return {
    ...defaults,
    ...userSettings,
    // Ensure required fields are never undefined
    name: userSettings.name || defaults.name,
    summary: userSettings.summary || defaults.summary,
    url: userSettings.url || url,
    role: userSettings.role || role,
    persona: userSettings.persona || defaults.persona,
  };
};

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
 * ✅ ENHANCED: Validate agent settings against schema constraints
 * 
 * This function ensures all settings meet database schema requirements:
 * - Field lengths (min/max)
 * - Value ranges (temperature, tokens, etc.)
 * - URL/email format validation
 * - Required field presence
 * 
 * @param settings - Settings to validate
 * @returns Validation result with specific errors
 */
export const validateAgentSettings = (
  settings: Partial<AgentSettings>
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const c = AGENT_SETTINGS_CONSTRAINTS; // Shorthand

  // ===== REQUIRED FIELDS =====
  if (!settings.url) {
    errors.push("URL is required");
  }

  // ===== URL VALIDATION =====
  if (settings.url && !isValidUrl(settings.url)) {
    errors.push("Invalid URL format");
  }

  if (settings.webhookUrl && !isValidUrl(settings.webhookUrl)) {
    errors.push("Invalid webhook URL format");
  }

  // ===== STRING LENGTH VALIDATION =====
  if (settings.name !== undefined) {
    if (settings.name.length < c.name.minLength) {
      errors.push(`Name must be at least ${c.name.minLength} character(s)`);
    }
    if (settings.name.length > c.name.maxLength) {
      errors.push(`Name cannot exceed ${c.name.maxLength} characters`);
    }
  }

  if (settings.persona !== undefined) {
    if (settings.persona.length < c.persona.minLength) {
      errors.push(`Persona must be at least ${c.persona.minLength} characters`);
    }
    if (settings.persona.length > c.persona.maxLength) {
      errors.push(`Persona cannot exceed ${c.persona.maxLength} characters`);
    }
  }

  if (settings.summary !== undefined && settings.summary.length > c.summary.maxLength) {
    errors.push(`Summary cannot exceed ${c.summary.maxLength} characters`);
  }

  if (settings.tone && settings.tone.length > c.tone.maxLength) {
    errors.push(`Tone cannot exceed ${c.tone.maxLength} characters`);
  }

  if (settings.customInstructions && settings.customInstructions.length > c.customInstructions.maxLength) {
    errors.push(`Custom instructions cannot exceed ${c.customInstructions.maxLength} characters`);
  }

  // ===== NUMERIC RANGE VALIDATION =====
  if (settings.contextRetrievalCount !== undefined) {
    if (
      settings.contextRetrievalCount < c.contextRetrievalCount.min ||
      settings.contextRetrievalCount > c.contextRetrievalCount.max
    ) {
      errors.push(
        `Context retrieval count must be between ${c.contextRetrievalCount.min} and ${c.contextRetrievalCount.max}`
      );
    }
  }

  if (settings.matchThreshold !== undefined) {
    if (
      settings.matchThreshold < c.matchThreshold.min ||
      settings.matchThreshold > c.matchThreshold.max
    ) {
      errors.push(
        `Match threshold must be between ${c.matchThreshold.min} and ${c.matchThreshold.max}`
      );
    }
  }

  if (settings.temperature !== undefined) {
    if (
      settings.temperature < c.temperature.min ||
      settings.temperature > c.temperature.max
    ) {
      errors.push(
        `Temperature must be between ${c.temperature.min} and ${c.temperature.max}`
      );
    }
  }

  if (settings.maxTokens !== undefined) {
    if (
      settings.maxTokens < c.maxTokens.min ||
      settings.maxTokens > c.maxTokens.max
    ) {
      errors.push(
        `Max tokens must be between ${c.maxTokens.min} and ${c.maxTokens.max}`
      );
    }
  }

  // ===== EMAIL VALIDATION =====
  if (settings.notificationEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.notificationEmail)) {
      errors.push("Invalid notification email format");
    }
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
 * 
 * These personas match the prompts used in LangChain service
 * See: lib/services/langchainService.ts
 */
export const getRolePersona = (roleId: string): string => {
  switch (roleId) {
    case "sales":
      return "Helpful sales representative focused on understanding customer needs and providing tailored solutions";
    case "support":
      return "Patient and knowledgeable support specialist who helps users resolve issues quickly";
    case "training":
      return "Clear and encouraging trainer who educates users on product features and best practices";
    case "custom":
      return "Professional and helpful assistant ready to help with any questions";
    default:
      return "Professional and helpful assistant";
  }
};

/**
 * ✅ NEW: Check if settings match defaults (useful for detecting changes)
 */
export const hasCustomSettings = (settings: AgentSettings): boolean => {
  const defaults = getDefaultAgentSettings(settings.url, settings.role);
  
  // Compare relevant fields (excluding required user-provided fields)
  return (
    settings.tone !== defaults.tone ||
    settings.contextRetrievalCount !== defaults.contextRetrievalCount ||
    settings.matchThreshold !== defaults.matchThreshold ||
    settings.temperature !== defaults.temperature ||
    settings.maxTokens !== defaults.maxTokens ||
    settings.leadCaptureEnabled !== defaults.leadCaptureEnabled ||
    settings.webhookEnabled !== defaults.webhookEnabled ||
    settings.crmEnabled !== defaults.crmEnabled ||
    !!settings.customInstructions ||
    !!settings.webhookUrl ||
    !!settings.crmType
  );
};

/**
 * ✅ NEW: Get settings summary for display
 */
export const getSettingsSummary = (settings: AgentSettings): string[] => {
  const summary: string[] = [];
  
  if (hasCustomSettings(settings)) {
    if (settings.customInstructions) {
      summary.push("Custom instructions configured");
    }
    if (settings.webhookEnabled && settings.webhookUrl) {
      summary.push("Webhook integration active");
    }
    if (settings.crmEnabled && settings.crmType) {
      summary.push(`${settings.crmType.toUpperCase()} CRM integration active`);
    }
    if (settings.temperature !== AGENT_SETTINGS_DEFAULTS.temperature) {
      summary.push(`Temperature: ${settings.temperature}`);
    }
    if (settings.contextRetrievalCount !== AGENT_SETTINGS_DEFAULTS.contextRetrievalCount) {
      summary.push(`Context chunks: ${settings.contextRetrievalCount}`);
    }
  } else {
    summary.push("Using default settings");
  }
  
  return summary;
};