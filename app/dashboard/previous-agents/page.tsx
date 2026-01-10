<<<<<<< HEAD

import { getAgents } from "@/lib/actions/agents";
import RealtimeAgentGrid from "@/components/agents/RealtimeAgentGrid";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PreviousAgentsPage() {
    const agents = await getAgents();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Agents</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor your deployed AI agents.</p>
                </div>
                <Link href="/dashboard/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Agent
                    </Button>
                </Link>
            </div>

            <RealtimeAgentGrid initialAgents={agents as any[]} />
=======
// app/dashboard/previous-agents/page.tsx
"use client";

import { useEffect, useState } from "react";
import { FilterBar } from "@/components/agents/FilterBar";
import { AgentCard, AgentProps } from "@/components/agents/AgentCard";
import { EmptyStateCard } from "@/components/agents/EmptyStateCard";
import { createClient } from "@/lib/supabase/client";
import type { Agent } from "@/types/agent";

export default function PreviousAgentsPage() {
  const [agents, setAgents] = useState<AgentProps[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch agents from database
  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Check if user is authenticated
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Please login to view your agents");
          setLoading(false);
          return;
        }

        // Fetch agents from database
        const { data, error: fetchError } = await supabase
          .from("agents")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching agents:", fetchError);
          setError("Failed to load agents. Please try again.");
          setLoading(false);
          return;
        }

        // Transform database agents to UI format
        const transformedAgents: AgentProps[] = (data || []).map((agent: any) =>
          transformAgentToProps(agent)
        );

        setAgents(transformedAgents);
        setFilteredAgents(transformedAgents);
        setLoading(false);
      } catch (err) {
        console.error("Exception fetching agents:", err);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  // Apply filters whenever search, status, or type changes
  useEffect(() => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.website.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (agent) => agent.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (agent) => agent.type.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    setFilteredAgents(filtered);
  }, [searchQuery, statusFilter, typeFilter, agents]);

  // Transform database agent to AgentProps format
  function transformAgentToProps(dbAgent: any): AgentProps {
    // Parse settings safely
    const settings =
      typeof dbAgent.settings === "string"
        ? JSON.parse(dbAgent.settings)
        : dbAgent.settings || {};

    // Map role to type
    const roleToType: Record<string, AgentProps["type"]> = {
      support: "Support Agent",
      sales: "Sales",
      training: "FAQ",
      custom: "Custom",
    };

    // Map status (database uses 'active'/'inactive', UI uses 'Running'/'Paused')
    const status = dbAgent.status === "active" ? "Running" : "Paused";

    // Generate description
    const description =
      settings.summary ||
      settings.persona ||
      `AI ${dbAgent.role} assistant for your website`;

    // ✅ FIXED: Generate unique tags and avoid duplicates
    const tagSet = new Set<string>();

    // Add the main type tag
    const mainType = roleToType[dbAgent.role] || "Custom";
    tagSet.add(mainType);

    // Add role tag only if different from type
    const roleCapitalized =
      dbAgent.role.charAt(0).toUpperCase() + dbAgent.role.slice(1);
    if (roleCapitalized !== mainType) {
      tagSet.add(roleCapitalized);
    }

    // Add feature-based tags
    if (settings.leadCaptureEnabled) {
      tagSet.add("Leads");
    }
    if (settings.crmEnabled) {
      tagSet.add("CRM");
    }

    // Convert Set to Array and limit to 3 tags
    const tags = Array.from(tagSet).slice(0, 3);

    return {
      id: dbAgent.id,
      name: dbAgent.name || "Unnamed Agent",
      type: mainType,
      status: status,
      description: description,
      website: dbAgent.website_url || "No website",
      conversations: "0", // TODO: Get from analytics when available
      lastActive: formatLastActive(dbAgent.updated_at),
      tags: tags,
    };
  }

  // Format last active time
  function formatLastActive(timestamp: string): string {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m Ago`;
    if (diffHours < 24) return `${diffHours}h Ago`;
    return `${diffDays}d Ago`;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Agents
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor your deployed AI agents.
        </p>
      </div>

      <FilterBar
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-muted-foreground">
              Loading your agents...
            </p>
          </div>
>>>>>>> chat-backup
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Render Real Agents */}
          {filteredAgents.length > 0 ? (
            <>
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
              {/* Show empty state card if there are agents */}
              <EmptyStateCard />
            </>
          ) : /* Show message if no agents match filters */
          searchQuery || statusFilter !== "all" || typeFilter !== "all" ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-2">
                No agents match your filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Show empty state card if no agents at all */
            <EmptyStateCard />
          )}
        </div>
      )}
    </div>
  );
}
