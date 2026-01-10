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

<<<<<<< HEAD
// wrapper for client-side JSON calls
export async function createAgentJson(data: {
    name: string;
    description?: string;
    url: string;
    role: string;
    tone: string;
}): Promise<CreateAgentState & { agentId?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fallback for no-auth (dev mode)
    const userId = user?.id || "mock-user-id";

    const newAgent = {
        user_id: userId,
        name: data.name,
        role: data.role,
        status: "active",
        settings: {
            url: data.url,
            description: data.description || `Agent for ${data.url}`,
            tone: data.tone,
        }
    };

    try {
        let resultAgent;
        if (userId === "mock-user-id") {
            resultAgent = { ...newAgent, id: "mock-agent-" + Date.now(), created_at: new Date().toISOString() };
        } else {
            const { data: inserted, error } = await supabase
                .from("agents")
                .insert(newAgent as any)
                .select()
                .single();

            if (error) {
                console.error("DB Error:", error);
                return { success: false, error: "Failed to save agent." };
            }
            resultAgent = inserted;
        }

        revalidatePath("/dashboard");
        return { success: true, agentId: resultAgent.id };
    } catch (e) {
        return { success: false, error: "Unexpected error" };
    }
}

export async function createAgent(
    prevState: CreateAgentState | null,
    formData: FormData
): Promise<CreateAgentState> {
    const supabase = await createClient();
=======
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
>>>>>>> chat-backup

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

<<<<<<< HEAD
    // Fallback for no-auth mode
    const userId = user?.id || "mock-user-id";

    // 2. Extract Data
    const rawData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string, // stored in settings or separate column?
        url: formData.get("url") as string,
        role: formData.get("role") as string,
        tone: formData.get("tone") as string,
    };

    // 3. Validate (Basic)
    if (!rawData.name || !rawData.url || !rawData.role) {
        return { success: false, error: "Missing required fields" };
    }

    // 4. Construct Agent Object
    // Assuming 'agents' table structure based on standard practices
    const newAgent = {
        user_id: userId,
        name: rawData.name,
        role: rawData.role,
        status: "active", // Default status
        settings: {
            url: rawData.url,
            description: rawData.description,
            tone: rawData.tone,
            // Default capabilities or other settings can go here
        },
        // created_at is usually auto-generated
    };

    try {
        let error = null;
        let data = null;

        if (userId === "mock-user-id") {
            // Simulate network delay
            await new Promise(r => setTimeout(r, 500));
            console.log("Mock Agent Saved:", newAgent);
        } else {
            const result = await supabase
                .from("agents")
                .insert(newAgent as any) // Explicit cast to avoid 'never' issue with potentially outdated types
                .select()
                .single();
            error = result.error;
            data = result.data;
        }

        if (error) {
            console.error("Database Error:", error);
            return { success: false, error: "Failed to save agent to database." };
        }

        // 5. Revalidate & Redirect
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/previous-agents");

        // We cannot redirect inside a try/catch block if we want to catch errors, 
        // but for server actions, it throws a NEXT_REDIRECT error which we should let pass.
        // However, simpler to return success and let client handle redirect or redirect here.
    } catch (error) {
        console.error("Create Agent Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }

    redirect("/dashboard");
=======
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
>>>>>>> chat-backup
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

<<<<<<< HEAD

=======
/**
 * Get agent statistics for the dashboard
 */
>>>>>>> chat-backup
export async function getAgentStats() {
  try {
    const supabase = await createClient();

<<<<<<< HEAD
    if (!user) {
        return {
            total: 12,
            active: 8,
            messages: 12500
        };
    }

    const { data, error } = await supabase
        .from('agents')
        .select('status')
        .eq('user_id', user.id);

    if (error) {
        return {
            total: 0,
            active: 0,
            messages: 0
        };
    }

    return {
        total: data.length,
        active: data.filter((a: any) => a.status === 'active' || a.status === 'running').length,
        messages: 12500 // Mock for now
    };
}

export async function getRecentActivity() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Mock data
        return [
            { id: "e1", description: "New conversation started from <strong>Pricing Page</strong>", timestamp: new Date().toISOString() },
            { id: "e2", description: "Agent updated memory bank", timestamp: new Date(Date.now() - 300000).toISOString() }
        ];
    }

    const { data } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

    // We need to transform this raw data to a friendly description
    // For now we'll just mock the transformation or return raw
    if (!data) return [];

    return data.map((event: any) => ({
        id: event.id,
        description: `Event: ${event.event_type}`, // Simple fallback
        timestamp: event.created_at
    }));
}

export async function getAnalyticsEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100); // Fetch last 100 for proper stats

    return data || [];
}

export async function getAgentById(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}

export async function getProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) return null;
    return data;
}

export async function getBillingUsage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            agentsCount: 0,
            conversationsCount: 0,
            planLimit: { agents: 3, conversations: 100 } // Default free limits
        };
    }

    // 1. Get Agent Count
    const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // 2. Get Profile for Plan Tier
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan_tier, onboarding_answers')
        .eq('id', user.id)
        .single() as any;

    const isPro = profile?.plan_tier === 'pro';
    const cardLast4 = profile?.onboarding_answers?.mock_card_last4 || '4242';

    // 3. Get Conversations Count (Approximate from events for now, or real count if we had a conversations table)
    // Using analytics_events 'session_start' or similar would be best. 
    // For now, let's count total events as a proxy or just return 0 if no better metric.
    // Actually, let's just count total 'analytics_events' for this user as "Usage" for now.
    const { count: eventsCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    return {
        agentsCount: agentsCount || 0,
        conversationsCount: eventsCount || 0,
        planLimit: {
            agents: isPro ? Infinity : 3,
            conversations: isPro ? Infinity : 100 // Example limits
        },
        isPro,
        cardLast4
    };
}

export async function updateProfile(profileId: string, updates: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("profiles")
        // @ts-ignore
        .update(updates)
        .eq("id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

export async function addPaymentMethod(mockToken: string, last4: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Simulate Stripe API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get existing onboarding answers to merge
    const { data: profile } = await supabase.from('profiles').select('onboarding_answers').eq('id', user.id).single() as any;
    const existingAnswers = profile?.onboarding_answers || {};

    const { error } = await supabase
        .from("profiles")
        // @ts-ignore
        .update({
            plan_tier: 'pro',
            subscription_status: 'active',
            stripe_subscription_id: 'sub_mock_1234567890',
            stripe_customer_id: 'cus_mock_1234567890',
            onboarding_answers: { ...existingAnswers, mock_card_last4: last4 }
        })
        .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

export async function removePaymentMethod() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Simulate Stripe API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, calling Stripe API to cancel subscription would go here.

    // Get existing onboarding answers to remove card data
    const { data: profile } = await supabase.from('profiles').select('onboarding_answers').eq('id', user.id).single();
    const existingAnswers: any = (profile as any)?.onboarding_answers || {};

    // Remove mock_card_last4
    if (existingAnswers.mock_card_last4) {
        delete existingAnswers.mock_card_last4;
    }

    const { error } = await supabase
        .from("profiles")
        // @ts-ignore
        .update({
            plan_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            stripe_customer_id: null,
            onboarding_answers: existingAnswers
        })
        .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateAgentSettings(agentId: string, settings: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Get current settings
    const { data: agent, error: fetchError } = await supabase
        .from("agents")
        .select("settings")
        .eq("id", agentId)
        .eq("user_id", user.id)
        .single();

    if (fetchError || !agent) {
        return { success: false, error: "Agent not found" };
    }

    // 2. Merge settings
    const currentSettings = (agent as any).settings || {};
    const newSettings = {
        ...currentSettings,
        ...settings
=======
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
>>>>>>> chat-backup
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
<<<<<<< HEAD
        .from("agents")
        // @ts-ignore
        .update({ settings: newSettings } as any)
        .eq("id", agentId);
=======
      .from("agents")
      .update(updateData)
      .eq("id", agentId);
>>>>>>> chat-backup

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

export async function getTrafficData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Mock data for dev/unauth
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: Math.floor(Math.random() * 50) + 10,
                date: date.toISOString().split('T')[0]
            };
        });
    }

    // Fetch analytics events for last 7 days from DB
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString()) as any;

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
        const dateKey = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        dayCounts.set(dateKey, 0);
        days.push({ day: dayName, date: dateKey, count: 0 });
    }

    data.forEach((event: any) => {
        const dateKey = event.created_at.split('T')[0];
        if (dayCounts.has(dateKey)) {
            dayCounts.set(dateKey, (dayCounts.get(dateKey) || 0) + 1);
        }
    });

    return days.map(d => ({
        ...d,
        count: dayCounts.get(d.date) || 0
    }));
}

export async function deleteAgent(agentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('user_id', user.id);

    if (error) {
        console.error("Delete Agent Error:", error);
        return { success: false, error: "Failed to delete agent" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}

export async function archiveAgent(agentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase
        .from('agents') as any)
        .update({ status: 'archived' })
        .eq('id', agentId)
        .eq('user_id', user.id);

    if (error) {
        return { success: false, error: "Failed to archive agent" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}

export async function duplicateAgent(agentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Fetch original agent
    const { data: original, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !original) {
        return { success: false, error: "Agent not found" };
    }

    // 2. Create copy
    const newAgent = {
        ...(original as any),
        id: undefined, // Let DB generate ID
        created_at: undefined,
        updated_at: undefined,
        name: `${(original as any).name} (Copy)`,
        status: 'draft' // Default to draft or stopped
    };

    const { error: insertError } = await supabase
        .from('agents')
        .insert(newAgent as any);

    if (insertError) {
        return { success: false, error: "Failed to duplicate agent" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateAgentStatus(agentId: string, status: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase
        .from('agents') as any)
        .update({ status })
        .eq('id', agentId)
        .eq('user_id', user.id);

    if (error) {
        return { success: false, error: "Failed to update status" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}

export async function getSingleAgentStats(agentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            totalMessages: 0,
            lastActive: null
        };
    }

    // Get total messages (both user and assistant)
    const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('event_type', 'message_sent');

    // Get last active time
    const { data: lastEvent } = await supabase
        .from('analytics_events')
        .select('created_at')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return {
        totalMessages: count || 0,
        lastActive: (lastEvent as any)?.created_at || null
    };
}

export async function getAgentConversations(agentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('agent_id', agentId)
        .eq('event_type', 'message_sent')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return [];

    return data.map((event: any) => ({
        id: event.id,
        role: event.metadata?.role || 'unknown',
        content: event.metadata?.content || 'No content available',
        timestamp: event.created_at
    }));
}
