"use client";

import { FilterBar } from "@/components/agents/FilterBar";
import { AgentCard, AgentProps } from "@/components/agents/AgentCard";
import { EmptyStateCard } from "@/components/agents/EmptyStateCard";

// Mock data to match the screenshot
const MOCK_AGENTS: AgentProps[] = [
    {
        id: "1",
        name: "Support Assistent",
        type: "Support Agent",
        status: "Running",
        description: "Automatically generated support agent based on your website content.",
        website: "yourwebsite.com",
        conversations: "120k",
        lastActive: "2h Ago",
        tags: ["Support Agent", "Sales", "FAQ", "Custom"],
    },
    {
        id: "2",
        name: "Support Assistent",
        type: "Support Agent",
        status: "Running",
        description: "Automatically generated support agent based on your website content.",
        website: "yourwebsite.com",
        conversations: "120k",
        lastActive: "2h Ago",
        tags: ["Support Agent", "Sales", "FAQ", "Custom"],
    },
    {
        id: "3",
        name: "Support Assistent",
        type: "Support Agent",
        status: "Running",
        description: "Automatically generated support agent based on your website content.",
        website: "yourwebsite.com",
        conversations: "120k",
        lastActive: "2h Ago",
        tags: ["Support Agent", "Sales", "FAQ", "Custom"],
    },
    {
        id: "4",
        name: "Support Assistent",
        type: "Support Agent",
        status: "Running",
        description: "Automatically generated support agent based on your website content.",
        website: "yourwebsite.com",
        conversations: "120k",
        lastActive: "2h Ago",
        tags: ["Support Agent", "Sales", "FAQ", "Custom"],
    },
    {
        id: "5",
        name: "Support Assistent",
        // wait, type should be enum.
        // Let's stick to consistent types.
        status: "Running",
        description: "Automatically generated support agent based on your website content.",
        website: "yourwebsite.com",
        conversations: "120k",
        lastActive: "2h Ago",
        // Fix type here
        type: "Support Agent",
        tags: ["Support Agent", "Sales", "FAQ", "Custom"],
    },
];

export default function PreviousAgentsPage() {
    return (
        <div className="space-y-6 pt-2 pb-10">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <h2 className="text-3xl font-bold text-slate-900 mb-8">Previous Agents</h2>

                <FilterBar />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Render 5 mock agents */}
                    {MOCK_AGENTS.map((agent) => (
                        <AgentCard key={agent.id} agent={agent} />
                    ))}

                    {/* Render Empty State Card as the last item to match design */}
                    <EmptyStateCard />
                </div>
            </div>
        </div>
    );
}
