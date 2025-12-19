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
                .insert(newAgent)
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

    if (!user) return { total: 4, active: 3 };

    // This is a naive implementation. For scale, use count() queries.
    const { data } = await supabase
        .from("agents")
        .select("status")
        .eq("user_id", user.id);

    if (!data) return { total: 0, active: 0 };

    return {
        total: data.length,
        active: data.filter(a => a.status === 'active' || a.status === 'running').length
    };
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
    const newSettings = {
        ...(agent.settings as object),
        ...settings
    };

    // 3. Update
    const { error: updateError } = await supabase
        .from("agents")
        .update({ settings: newSettings })
        .eq("id", agentId);

    if (updateError) {
        return { success: false, error: "Failed to update settings" };
    }

    revalidatePath("/dashboard/integrations");
    return { success: true };
}
