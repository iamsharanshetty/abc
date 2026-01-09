"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button"; // Check imports
import { cn } from "@/lib/utils";

interface DailyTraffic {
    day: string;
    count: number;
    date: string;
}

export default function RealtimeTrafficChart({ initialData }: { initialData: DailyTraffic[] }) {
    // In a real app we might use Recharts, but sticking to the CSS bar chart for consistency with the design I saw
    const [data, setData] = useState(initialData);

    // Simple normalization for height
    const max = Math.max(...data.map(d => d.count), 1); // avoid divide by zero

    return (
        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-foreground">Traffic Overview</h3>
                    <p className="text-sm text-muted-foreground">Visitor engagement over time</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs">This Week</Button>
                </div>
            </div>
            <div className="p-6">
                <div className="relative h-[300px] w-full flex items-end justify-between gap-2 px-2">
                    {data.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No traffic data yet
                        </div>
                    ) : (
                        data.map((d, i) => {
                            const heightPercent = (d.count / max) * 100;
                            // Ensure at least a tiny sliver is shown if 0? No, 0 is 0.
                            // Actually let's min-height 5% so it looks like a bar exists if count > 0
                            const barHeight = d.count > 0 ? Math.max(heightPercent, 5) : 0;

                            return (
                                <div key={i} className="w-full bg-secondary/30 rounded-t-lg relative group h-full flex items-end">
                                    <div
                                        className="w-full bg-blue-500/80 hover:bg-blue-500 transition-all duration-500 rounded-t-md mx-1"
                                        style={{ height: `${barHeight}%` }}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border pointer-events-none whitespace-nowrap z-10">
                                            {d.count} Events
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-muted-foreground font-medium">
                                        {d.day}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Card>
    );
}
