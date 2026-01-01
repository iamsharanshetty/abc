// lib/actions/agents.ts - Server Actions for Agent Management
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/utils/logger";
import type { Agent, AgentSettings } from "@/types/agent";
import { getDefaultAgentSettings } from "@/types/agent";
import { revalidatePath } from "next/cache";

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
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching agents", { error: error.message });
      return [];
    }

    return (data || []) as Agent[];
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
      .single();

    if (error) {
      logger.error("Error fetching agent", { error: error.message, agentId });
      return null;
    }

    return data as Agent;
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

    // Get all agents
    const { data: agents, error } = await supabase
      .from("agents")
      .select("status");

    if (error) {
      logger.error("Error fetching agent stats", { error: error.message });
      return { total: 0, active: 0, inactive: 0, training: 0 };
    }

    // Calculate stats
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

    // Insert agent
    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        user_id: user.id,
        name: data.name,
        role: data.role,
        status: "active",
        settings: settings as any,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating agent", { error: error.message });
      return { success: false, error: error.message };
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
      .single();

    if (fetchError || !existingAgent) {
      return { success: false, error: "Agent not found" };
    }

    // Merge settings
    const currentSettings = existingAgent.settings as AgentSettings;
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };

    // Update agent
    const { error: updateError } = await supabase
      .from("agents")
      .update({ settings: updatedSettings as any })
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

    const { error } = await supabase
      .from("agents")
      .update({ status })
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
