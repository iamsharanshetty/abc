// lib/actions/agents.ts - Server Actions for Agent Management
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { AgentSettings } from "@/types/agent";
import { getDefaultAgentSettings } from "@/types/agent";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";
import type { Json } from "@/lib/database.types";

// Type helpers
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

// ✅ FIXED: Agent interface that matches actual database schema
export interface Agent {
  id: string;
  user_id: string;
  name: string;
  role: "sales" | "support" | "training" | "custom";
  status: "active" | "inactive" | "training";
  settings: AgentSettings;
  created_at: string;
}

/**
 * ✅ FIXED: Helper to safely convert Json to AgentSettings
 */
function parseAgentSettings(settings: Json): AgentSettings {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    console.warn("Invalid settings format, using defaults");
    return getDefaultAgentSettings("", "support");
  }

  const settingsObj = settings as Record<string, any>;

  return {
    name: settingsObj.name || "",
    persona: settingsObj.persona || "",
    summary: settingsObj.summary || "",
    role: settingsObj.role || "support",
    url: settingsObj.url || "",
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
 * Now only uses fields that exist in the database
 */
function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    role: row.role as "sales" | "support" | "training" | "custom",
    status: row.status as "active" | "inactive" | "training",
    settings: parseAgentSettings(row.settings),
    created_at: row.created_at,
  };
}

/**
 * Get all agents for the current user
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("User not authenticated in getAgents");
      return [];
    }

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<AgentRow[]>();

    if (error) {
      logger.error("Error fetching agents", { error: error.message });
      return [];
    }

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

    const { data: agents, error } = await supabase
      .from("agents")
      .select("status")
      .returns<Pick<AgentRow, "status">[]>();

    if (error) {
      logger.error("Error fetching agent stats", { error: error.message });
      return { total: 0, active: 0, inactive: 0, training: 0 };
    }

    const stats = {
      total: agents?.length || 0,
      active: agents?.filter((a) => a.status === "active").length || 0,
      inactive: agents?.filter((a) => a.status === "inactive").length || 0,
      training: agents?.filter((a) => a.status === "training").length || 0,
    };

    return stats;
  } catch (error) {
    logger.error("Exception in getAgentStats", { error });
    return { total: 0, active: 0, inactive: 0, training: 0 };
  }
}

/**
 * ✅ FIXED: Create a new agent
 * Now includes website_url field required by the database schema
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

    // ✅ FIXED: Include website_url field required by database schema
    const insertData: AgentInsert = {
      user_id: user.id,
      name: data.name,
      website_url: data.websiteUrl, // Added required field
      role: data.role,
      status: "active",
      settings: settings as unknown as Json,
    };

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

    // Parse existing settings safely
    const currentSettings = parseAgentSettings(existingAgent.settings);

    // Merge with new settings
    const updatedSettings: AgentSettings = {
      ...currentSettings,
      ...settings,
    };

    // Prepare update data
    const updateData: AgentUpdate = {
      settings: updatedSettings as unknown as Json,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", agentId);

    if (error) {
      logger.error("Error updating agent settings", {
        error: error.message,
        agentId,
      });
      return { success: false, error: error.message };
    }

    logger.info("Agent settings updated", { agentId });

    revalidatePath("/dashboard");

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
 * ✅ FIXED: Update agent status (removed duplicate)
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
 * ✅ FIXED: Delete an agent (removed duplicate)
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

/**
 * Archive an agent (sets status to inactive)
 */
export async function archiveAgent(agentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return updateAgentStatus(agentId, "inactive");
}

/**
 * ✅ FIXED: Duplicate an agent
 * Now includes website_url field from the original agent
 */
export async function duplicateAgent(agentId: string): Promise<{
  success: boolean;
  agentId?: string;
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

    // Fetch original agent
    const { data: original, error: fetchError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single<AgentRow>();

    if (fetchError || !original) {
      return { success: false, error: "Agent not found" };
    }

    // Create copy with website_url from original
    const insertData: AgentInsert = {
      user_id: user.id,
      name: `${original.name} (Copy)`,
      website_url: original.website_url, // Added required field from original
      role: original.role,
      status: "inactive", // Start as inactive
      settings: original.settings,
    };

    const { data: newAgent, error: insertError } = await supabase
      .from("agents")
      .insert(insertData)
      .select()
      .single<AgentRow>();

    if (insertError || !newAgent) {
      return { success: false, error: "Failed to duplicate agent" };
    }

    revalidatePath("/dashboard");

    return { success: true, agentId: newAgent.id };
  } catch (error) {
    logger.error("Exception in duplicateAgent", { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to duplicate agent",
    };
  }
}

/**
 * Get traffic data for analytics
 */
export async function getTrafficData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Mock data for dev/unauth
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: Math.floor(Math.random() * 50) + 10,
        date: date.toISOString().split("T")[0],
      };
    });
  }

  // Fetch analytics events for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("analytics_events")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error || !data) {
    return [];
  }

  // Aggregate by day
  const dayCounts = new Map<string, number>();
  const days: any[] = [];

  // Init last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    dayCounts.set(dateKey, 0);
    days.push({ day: dayName, date: dateKey, count: 0 });
  }

  data.forEach((event: any) => {
    const dateKey = event.created_at.split("T")[0];
    if (dayCounts.has(dateKey)) {
      dayCounts.set(dateKey, (dayCounts.get(dateKey) || 0) + 1);
    }
  });

  return days.map((d) => ({
    ...d,
    count: dayCounts.get(d.date) || 0,
  }));
}

/**
 * Get stats for a single agent
 */
export async function getSingleAgentStats(agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalMessages: 0,
      lastActive: null,
    };
  }

  // Get total messages
  const { count } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("event_type", "message_sent");

  // Get last active time
  const { data: lastEvent } = await supabase
    .from("analytics_events")
    .select("created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    totalMessages: count || 0,
    lastActive: (lastEvent as any)?.created_at || null,
  };
}

/**
 * Get conversations for an agent
 */
export async function getAgentConversations(agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("agent_id", agentId)
    .eq("event_type", "message_sent")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];

  return data.map((event: any) => ({
    id: event.id,
    role: event.metadata?.role || "unknown",
    content: event.metadata?.content || "No content available",
    timestamp: event.created_at,
  }));
}
