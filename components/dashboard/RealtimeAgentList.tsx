"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

// Define strict types for Agent
interface Agent {
    id: string;
    name: string;
    role: string;
    status: string;
    user_id: string;
    // ... other fields
}

export default function RealtimeAgentList({ initialAgents }: { initialAgents: Agent[] }) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel('realtime_agents')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agents' },
                (payload) => {
                    console.log('Realtime change:', payload);
                    if (payload.eventType === 'INSERT') {
                        setAgents((prev) => [payload.new as Agent, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setAgents((prev) => prev.map(agent => agent.id === payload.new.id ? { ...agent, ...payload.new } : agent));
                    } else if (payload.eventType === 'DELETE') {
                        setAgents((prev) => prev.filter(agent => agent.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const hasAgents = agents.length > 0;

    return (
        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">

            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-foreground">Deployed Agents</h3>
                    <p className="text-sm text-muted-foreground">Manage your active AI representatives</p>
                </div>
            </div>

            <div className="p-0">
                {!hasAgents ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bot className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No agents yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first agent to start engaging visitors.</p>
                        <Link href="/dashboard/create">
                            <Button>Create Agent</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/10">
                            <div className="col-span-5">Name</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-2">Role</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Agent Rows */}
                        {agents.map((agent) => (
                            <div key={agent.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/20 transition-colors group">
                                <div className="col-span-5 font-medium text-foreground flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                        {agent.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {agent.name}
                                </div>
                                <div className="col-span-3">
                                    <Badge status={agent.status} />
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground capitalize">
                                    {agent.role}
                                </div>
                                <div className="col-span-2 text-right">
                                    <Link href={`/dashboard/agent/${agent.id}`}>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

function Badge({ status }: { status: string }) {
    const isRunning = status === 'active';
    return (
        <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            isRunning
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
        )}>
            <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", isRunning ? "bg-emerald-500" : "bg-slate-500")} />
            {isRunning ? 'Active' : 'Paused'}
        </div>
    )
}
