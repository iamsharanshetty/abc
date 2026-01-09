"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AgentSettings } from "@/types/agent";

export type CreateAgentState = {
    success?: boolean;
    error?: string;
    fieldErrors?: {
        [key: string]: string[];
    };
};

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

    // 1. Check Authentication
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // if (!user) {
    //     return { success: false, error: "You must be logged in to create an agent" };
    // }

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
}

export async function getAgents() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Return mock data for no-auth mode
        return [
            {
                id: "1",
                name: "Support Assistant",
                role: "support",
                status: "active",
                user_id: "mock",
                created_at: new Date().toISOString(),
                settings: { url: "example.com" }
            },
            {
                id: "2",
                name: "Sales Bot",
                role: "sales",
                status: "active",
                user_id: "mock",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                settings: { url: "example.com" }
            }
        ];
    }

    const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching agents:", error);
        return [];
    }

    return data;
}


export async function getAgentStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
    };

    // 3. Update
    const { error: updateError } = await supabase
        .from("agents")
        // @ts-ignore
        .update({ settings: newSettings } as any)
        .eq("id", agentId);

    if (updateError) {
        return { success: false, error: "Failed to update settings" };
    }

    revalidatePath("/dashboard/integrations");
    return { success: true };
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
