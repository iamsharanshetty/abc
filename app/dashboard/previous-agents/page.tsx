
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
        </div>
    );
}
