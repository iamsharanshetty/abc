import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAgents, getAgentStats, getRecentActivity, getTrafficData } from "@/lib/actions/agents";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";

import RealtimeStats from "@/components/dashboard/RealtimeStats";
import RealtimeAgentList from "@/components/dashboard/RealtimeAgentList";
import RealtimeActivity from "@/components/dashboard/RealtimeActivity";
import RealtimeTrafficChart from "@/components/dashboard/RealtimeTrafficChart";

export default async function DashboardPage() {
    const stats = await getAgentStats();
    const agents = await getAgents();
    const activity = await getRecentActivity();
    const trafficData = await getTrafficData();

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
                </div>
                <Link href="/dashboard/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Agent
                    </Button>
                </Link>
            </div>

            {/* 1. Realtime Stats */}
            <RealtimeStats initialStats={stats} />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 2. Main Chart Section & Agent List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[400px]">
                        <RealtimeTrafficChart initialData={trafficData} />
                    </div>

                    {/* Realtime Agent List */}
                    <RealtimeAgentList initialAgents={agents as any[]} />
                </div>

                {/* 3. Right Sidebar / Insights */}
                <div className="space-y-6">
                    <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-blue-600 to-violet-700 text-white overflow-hidden relative border-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="p-8">
                            <h3 className="text-lg font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-blue-100/80 text-sm mb-6 leading-relaxed">
                                Unlock unlimited agents, advanced analytics, and custom LLM fine-tuning.
                            </p>
                            <Link href="/pricing">
                                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-semibold">
                                    View Plans
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Realtime Activity Feed */}
                    <RealtimeActivity initialActivity={activity} />
                </div>
            </div>
        </div>
    )
}

