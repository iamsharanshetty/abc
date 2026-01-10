// lib/actions/agents.ts - Server Actions for Agent Management
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { Agent, AgentSettings } from "@/types/agent";
import { getDefaultAgentSettings } from "@/types/agent";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";
import type { Json } from "@/lib/database.types";

// Type helpers
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

/**
 * ✅ NEW: Helper to safely convert Json to AgentSettings
 * This handles the type conversion from Supabase's Json type to AgentSettings
 */
function parseAgentSettings(settings: Json): AgentSettings {
  // If settings is null or not an object, return defaults
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    console.warn("Invalid settings format, using defaults");
    return getDefaultAgentSettings("", "support");
  }

  // Cast to a more specific type first
  const settingsObj = settings as Record<string, any>;

  // Return settings with proper type, using defaults for missing fields
  return {
    // Required fields
    name: settingsObj.name || "",
    persona: settingsObj.persona || "",
    summary: settingsObj.summary || "",
    role: settingsObj.role || "support",
    url: settingsObj.url || "",

    // Optional fields - only include if they exist
    tone: settingsObj.tone,
    customInstructions: settingsObj.customInstructions,
    contextRetrievalCount: settingsObj.contextRetrievalCount,
    matchThreshold: settingsObj.matchThreshold,
    temperature: settingsObj.temperature,
    maxTokens: settingsObj.maxTokens,
    leadCaptureEnabled: settingsObj.leadCaptureEnabled,
    webhookEnabled: settingsObj.webhookEnabled,
    webhookUrl: settingsObj.webhookUrl,
    crmEnabled: settingsObj.crmEnabled,
    crmType: settingsObj.crmType as "hubspot" | "salesforce" | undefined,
    notificationEmail: settingsObj.notificationEmail,
  };
}

/**
 * ✅ FIXED: Helper to convert database row to Agent type
 * Now uses parseAgentSettings for safe type conversion
 */
function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    website_url: row.website_url,
    role: row.role as "sales" | "support" | "training" | "custom",
    system_prompt: row.system_prompt || undefined,
    status: row.status as "active" | "inactive" | "training",
    settings: parseAgentSettings(row.settings), // ✅ Safe conversion
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata ? (row.metadata as Record<string, any>) : undefined,
  };
}

/**
 * Get all agents for the current user
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("User not authenticated in getAgents");
      return [];
    }

    // Fetch agents - RLS will automatically filter by user_id
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<AgentRow[]>();

    if (error) {
      logger.error("Error fetching agents", { error: error.message });
      return [];
    }

    // Convert database rows to Agent type
    return (data || []).map(rowToAgent);
  } catch (error) {
    logger.error("Exception in getAgents", { error });
    return [];
  }
}

/**
 * Get a single agent by ID
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("User not authenticated in getAgent");
      return null;
    }

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single<AgentRow>();

    if (error) {
      logger.error("Error fetching agent", { error: error.message, agentId });
      return null;
    }

    // Convert database row to Agent type
    return rowToAgent(data);
  } catch (error) {
    logger.error("Exception in getAgent", { error });
    return null;
  }
}

/**
 * Get agent statistics for the dashboard
 */
export async function getAgentStats() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("User not authenticated in getAgentStats");
      return { total: 0, active: 0, inactive: 0, training: 0 };
    }

    // Get all agents with proper typing
    const { data: agents, error } = await supabase
      .from("agents")
      .select("status")
      .returns<Pick<AgentRow, "status">[]>();

    if (error) {
      logger.error("Error fetching agent stats", { error: error.message });
      return { total: 0, active: 0, inactive: 0, training: 0 };
    }

    // Calculate stats
    const stats = {
      total: agents?.length || 0,
      active:
        agents?.filter((a: Pick<AgentRow, "status">) => a.status === "active")
          .length || 0,
      inactive:
        agents?.filter((a: Pick<AgentRow, "status">) => a.status === "inactive")
          .length || 0,
      training:
        agents?.filter((a: Pick<AgentRow, "status">) => a.status === "training")
          .length || 0,
    };

    return stats;
  } catch (error) {
    logger.error("Exception in getAgentStats", { error });
    return { total: 0, active: 0, inactive: 0, training: 0 };
  }
}

/**
 * Create a new agent
 */
export async function createAgent(data: {
  name: string;
  websiteUrl: string;
  role: "sales" | "support" | "training" | "custom";
  settings?: Partial<AgentSettings>;
}): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Create default settings
    const defaultSettings = getDefaultAgentSettings(data.websiteUrl, data.role);

    // Merge with user settings
    const settings: AgentSettings = {
      ...defaultSettings,
      ...data.settings,
      name: data.name,
      url: data.websiteUrl,
      role: data.role,
    };

    // Prepare insert data with proper typing
    const insertData: AgentInsert = {
      user_id: user.id,
      name: data.name,
      website_url: data.websiteUrl,
      role: data.role,
      status: "active",
      settings:
        settings as unknown as Database["public"]["Tables"]["agents"]["Insert"]["settings"],
    };

    // Insert agent
    const { data: agent, error } = await supabase
      .from("agents")
      .insert(insertData)
      .select()
      .single<AgentRow>();

    if (error) {
      logger.error("Error creating agent", { error: error.message });
      return { success: false, error: error.message };
    }

    if (!agent) {
      return { success: false, error: "No agent returned from database" };
    }

    logger.info("Agent created", { agentId: agent.id, userId: user.id });

    // Revalidate dashboard
    revalidatePath("/dashboard");

    return { success: true, agentId: agent.id };
  } catch (error) {
    logger.error("Exception in createAgent", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create agent",
    };
  }
}

/**
 * Update agent settings
 */
export async function updateAgentSettings(
  agentId: string,
  settings: Partial<AgentSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Get existing agent
    const { data: existingAgent, error: fetchError } = await supabase
      .from("agents")
      .select("settings")
      .eq("id", agentId)
      .single<Pick<AgentRow, "settings">>();

    if (fetchError || !existingAgent) {
      return { success: false, error: "Agent not found" };
    }

    // ✅ FIXED: Safely parse existing settings first
    const currentSettings = parseAgentSettings(existingAgent.settings);

    // Merge with new settings
    const updatedSettings: AgentSettings = {
      ...currentSettings,
      ...settings,
    };

    // Prepare update data with proper typing
    const updateData: AgentUpdate = {
      settings:
        updatedSettings as unknown as Database["public"]["Tables"]["agents"]["Update"]["settings"],
    };

    // Update agent
    const { error: updateError } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", agentId);

    if (updateError) {
      logger.error("Error updating agent settings", {
        error: updateError.message,
        agentId,
      });
      return { success: false, error: updateError.message };
    }

    logger.info("Agent settings updated", { agentId });

    // Revalidate pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/integrations");

    return { success: true };
  } catch (error) {
    logger.error("Exception in updateAgentSettings", { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
  agentId: string,
  status: "active" | "inactive" | "training"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const updateData: AgentUpdate = { status };

    const { error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", agentId);

    if (error) {
      logger.error("Error updating agent status", {
        error: error.message,
        agentId,
      });
      return { success: false, error: error.message };
    }

    logger.info("Agent status updated", { agentId, status });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    logger.error("Exception in updateAgentStatus", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase.from("agents").delete().eq("id", agentId);

    if (error) {
      logger.error("Error deleting agent", {
        error: error.message,
        agentId,
      });
      return { success: false, error: error.message };
    }

    logger.info("Agent deleted", { agentId });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    logger.error("Exception in deleteAgent", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete agent",
    };
  }
}
