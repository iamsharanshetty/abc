"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";

export default function RealtimeActivity({ initialActivity }: { initialActivity: any[] }) {
    // To handle real-time updates for "Recent Activity", we will subscribe to the 'analytics_events' table.
    // However, since we don't have a direct 'getRecentActivity' function exposed yet (it was mocked),
    // we will start by rendering the static received initialActivity, and then append new events.

    // For this demonstration, we'll assume the initialActivity array structure matches what we expect from the DB.

    const [activities, setActivities] = useState<any[]>(initialActivity);
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel('realtime_activity')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'analytics_events' },
                (payload) => {
                    // In a real app we'd probably want to fetch the enriched data (like user name etc if linked),
                    // but for a raw feed, we can just use the payload.

                    // We'll optimistically add it to the top
                    const newEvent = {
                        id: payload.new.id,
                        // Adapt payload to match UI shape. 
                        // Mocking the 'description' derived from event type for now
                        description: `New event: ${payload.new.event_type}`,
                        timestamp: new Date().toISOString(),
                        // ...
                    };

                    setActivities((prev) => [newEvent, ...prev].slice(0, 10)); // Keep mostly recent 10
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <Card className="rounded-3xl border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                    ) : (
                        activities.map((activity, i) => (
                            <div key={activity.id || i} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: activity.description }} />
                                    <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}

function formatTimeAgo(dateString: string) {
    // Simple mock time-ago for now
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    return "Today";
}
