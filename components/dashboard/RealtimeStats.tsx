"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Assumes we have a client-side supabase helper
import { Card } from "@/components/ui/Card";
import { Bot, Activity, MoreHorizontal, ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
    total: number;
    active: number;
    messages: number; // Placeholder for now
}

export default function RealtimeStats({ initialStats }: { initialStats: StatsData }) {
    const [stats, setStats] = useState<StatsData>(initialStats);
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel('realtime_stats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agents' },
                () => {
                    // Refresh stats on any agent change
                    // In a real app we might fetch count directly or use the payload
                    // For now, we'll optimistically simplistic update or just re-fetch
                    // Let's re-fetch safely via a clear server action wrapper if possible, 
                    // or just increment/decrement based on event type if we had the logic.
                    // To keep it simple and robust: we will listen and then triggers a re-fetch of the specific count 
                    // OR simple increment/decrement logic if the payload is comprehensive.
                    
                    // Actually, for "Total Agents", we can just listen to INSERT/DELETE
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             {/* ... Render StatCards using `stats` state ... */}
             <StatCard
                title="Total Agents"
                value={stats.total.toString()}
                description="Deployed across sites"
                icon={<Bot className="w-5 h-5 text-blue-500" />}
            />
            {/* ... other cards ... */}
        </div>
    );
}

function StatCard({ title, value, description, icon, trend, trendUp }: any) {
    // ... same as before ...
    return (
         <Card className="rounded-2xl border-border/50 bg-card shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-secondary/50 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                    {icon}
                </div>
                {trend && (
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", trendUp ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
            </div>
        </Card>
    )
}
