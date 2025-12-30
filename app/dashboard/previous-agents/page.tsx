"use client";

import { FilterBar } from "@/components/agents/FilterBar";
import { AgentCard, AgentProps } from "@/components/agents/AgentCard";
import { EmptyStateCard } from "@/components/agents/EmptyStateCard";

// Mock data to match the screenshot
const MOCK_AGENTS: AgentProps[] = [
    {
        id: "1",
        name: "Customer Support",
        type: "Support Agent",
        status: "Running",
        description: "Handles product inquiries, troubleshooting, and general FAQs automatically based on documentation.",
        website: "docs.webrep.ai",
        conversations: "120k",
        lastActive: "2h Ago",
        tags: ["Support", "Docs", "FAQ"],
    },
    {
        id: "2",
        name: "Sales Representive",
        type: "Sales",
        status: "Running",
        description: "Engages visitors, qualifies leads, and schedules demos for the sales team.",
        website: "webrep.ai/pricing",
        conversations: "45k",
        lastActive: "5m Ago",
        tags: ["Sales", "Leads", "Conversion"],
    },
    {
        id: "3",
        name: "Onboarding Helper",
        type: "Custom",
        status: "Paused",
        description: "Guile new users through the platform setup process and initial configuration.",
        website: "app.webrep.ai",
        conversations: "12k",
        lastActive: "1d Ago",
        tags: ["Onboarding", "Product"],
    },
];

export default function PreviousAgentsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Agents</h1>
                <p className="text-muted-foreground mt-1">Manage and monitor your deployed AI agents.</p>
            </div>

            <FilterBar />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Render Mock Agents */}
                {MOCK_AGENTS.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                ))}

                {/* Render Empty State Card as the last item to match design */}
                <EmptyStateCard />
            </div>
        </div>
    );
}
