"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AgentCard, AgentProps } from "@/components/agents/AgentCard";
import { EmptyStateCard } from "@/components/agents/EmptyStateCard";
import { FilterBar } from "@/components/agents/FilterBar";

interface DB_Agent {
    id: string;
    name: string;
    role: string;
    status: string;
    settings: any;
    updated_at: string;
    created_at: string;
    // ... other fields
}

// Function to map DB Agent to AgentProps
function mapAgentToProp(agent: DB_Agent): AgentProps {
    const settings = agent.settings || {};
    // Map DB status to UI friendly status string if needed, or pass directly
    // AgentCard expects the raw DB value largely but logic inside handles it
    // Actually AgentCard expects "Running" | "Paused" etc in type definition but handles string in logic
    // Let's pass the raw status mostly but capitalized for better initial prop if mapped
    // Ideally we pass raw and let Component derive label.
    // For now:
    return {
        id: agent.id,
        name: agent.name,
        type: (agent.role as any) || "Custom",
        status: agent.status, // Pass raw status to component, component handles color/label
        description: settings.description || "No description provided.",
        website: settings.url || "unknown",
        conversations: "0",
        lastActive: "Just now",
        tags: [agent.role, "AI"],
    };
}

export default function RealtimeAgentGrid({ initialAgents }: { initialAgents: DB_Agent[] }) {
    const [agents, setAgents] = useState<DB_Agent[]>(initialAgents);
    const [filteredAgents, setFilteredAgents] = useState<DB_Agent[]>(initialAgents);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [typeFilter, setTypeFilter] = useState<string | undefined>();

    // Store Supabase client
    const supabase = createClient();

    // 1. Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime_agent_grid')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agents' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setAgents((prev) => [payload.new as DB_Agent, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setAgents((prev) => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
                    } else if (payload.eventType === 'DELETE') {
                        setAgents((prev) => prev.filter(a => a.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // 2. Client-side Filtering
    useEffect(() => {
        let result = agents;

        // Search Filter
        if (search) {
            result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
        }

        // Status Filter
        if (statusFilter) {
            // Note: DB status is lowercase 'running', 'paused', 'active', 'archived', 'draft'
            // statusFilter values: "Running", "Paused", "Draft"
            const dbStatus = statusFilter.toLowerCase();
            // Handle mapping if needed. 'Running' matches 'active' or 'running'
            if (statusFilter === "Running") {
                result = result.filter(a => a.status === 'running' || a.status === 'active');
            } else {
                result = result.filter(a => a.status === dbStatus);
            }
        } else {
            // Default: Hide archived agents
            result = result.filter(a => a.status !== 'archived');
        }

        // Type Filter (role)
        if (typeFilter) {
            result = result.filter(a => a.role === typeFilter);
        }

        setFilteredAgents(result);
    }, [agents, search, statusFilter, typeFilter]);


    return (
        <>
            <FilterBar
                onSearchChange={setSearch}
                onStatusChange={setStatusFilter}
                onTypeChange={setTypeFilter}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAgents.length > 0 ? (
                    filteredAgents.map((agent) => (
                        <AgentCard key={agent.id} agent={mapAgentToProp(agent)} />
                    ))
                ) : (
                    <EmptyStateCard />
                )}
            </div>
        </>
    );
}
